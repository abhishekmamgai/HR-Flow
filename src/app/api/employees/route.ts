import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCompanyContext } from "@/lib/auth/company-context";

const schema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(15).optional(),
  department_id: z.string().uuid().optional().nullable(),
  designation: z.string().max(100).optional(),
  employment_type: z.enum(["full_time", "part_time", "contract", "intern"]).optional(),
  base_salary: z.coerce.number().optional().default(0),
  hra: z.coerce.number().optional().default(0),
  allowances: z.coerce.number().optional().default(0),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const supabase = await createClient();
    const adminClient = createAdminClient();
    const { companyId } = await getCompanyContext();

    // 1. Auto-generate next employee_code (ASK-2026-XXX)
    const { data: latestEmp } = await supabase
      .from("employees")
      .select("employee_code")
      .eq("company_id", companyId)
      .like("employee_code", "ASK-2026-%")
      .order("employee_code", { ascending: false })
      .limit(1)
      .single();

    let nextCode = "ASK-2026-001";
    if (latestEmp) {
      const currentNum = parseInt(latestEmp.employee_code.split("-")[2]);
      nextCode = `ASK-2026-${String(currentNum + 1).padStart(3, "0")}`;
    }

    // 2. Create Supabase Auth user via Admin API
    const tempPassword = "AskTech@123";
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { first_login: true, role: "employee" },
    });

    if (authError) {
      return NextResponse.json({ error: `Auth creation failed: ${authError.message}` }, { status: 400 });
    }

    const userId = authUser.user.id;

    // 3. Create company_users record (role: 'employee')
    const { error: roleError } = await adminClient.from("company_users").insert({
      company_id: companyId,
      user_id: userId,
      role: "employee",
    });

    if (roleError) {
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: `Role assignment failed: ${roleError.message}` }, { status: 400 });
    }

    // 4. INSERT employee record
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .insert({
        company_id: companyId,
        user_id: userId,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        email: parsed.data.email,
        employee_code: nextCode,
        department_id: parsed.data.department_id ?? null,
        designation: parsed.data.designation ?? null,
        employment_type: parsed.data.employment_type ?? "full_time",
        status: "active",
        first_login: true,
        base_salary: parsed.data.base_salary,
        hra: parsed.data.hra,
        allowances: parsed.data.allowances,
      })
      .select("id")
      .single();

    if (empError) {
      // Cleanup auth user if DB insert fails
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: empError.message }, { status: 400 });
    }

    // 5. Insert into employee_credentials
    const { error: credError } = await adminClient
      .from("employee_credentials")
      .insert({
        company_id: companyId,
        employee_id: employee.id,
        employee_code: nextCode,
        temp_password: tempPassword,
        is_password_changed: false,
      });

    if (credError) {
      console.error("❌ Credentials insertion failed:", credError);
      // We don't fail the whole request here as employee is already created,
      // but it's important to log it.
    }

    // 6. Seed initial leave balances (CL 12, EL 15, SL 12)
    const year = new Date().getFullYear();
    const { data: leaveTypes } = await supabase.from("leave_types").select("id, code").eq("company_id", companyId);
    
    if (leaveTypes) {
      const balances = leaveTypes.map(lt => ({
        company_id: companyId,
        employee_id: employee.id,
        leave_type_id: lt.id,
        year,
        total: lt.code === "CL" ? 12 : lt.code === "EL" ? 15 : lt.code === "SL" ? 12 : 0,
        used: 0,
        pending: 0
      })).filter(b => b.total > 0);

      if (balances.length > 0) {
        await supabase.from("leave_balances").insert(balances);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: employee.id,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        employee_code: nextCode,
        temp_password: tempPassword,
        email: parsed.data.email,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to add employee";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
