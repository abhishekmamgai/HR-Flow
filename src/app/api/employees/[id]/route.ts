import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCompanyContext } from "@/lib/auth/company-context";

const schema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  department_id: z.string().uuid().optional().nullable(),
  designation: z.string().max(100).optional(),
  status: z.enum(["active", "on_leave", "terminated", "notice_period"]).optional(),
  employee_code: z.string().max(20).optional(),
  base_salary: z.coerce.number().optional(),
  hra: z.coerce.number().optional(),
  allowances: z.coerce.number().optional(),
  tds_annual_projected: z.coerce.number().optional(),
  professional_tax: z.coerce.number().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const supabase = await createClient();
    const { companyId } = await getCompanyContext();

    const { error } = await supabase
      .from("employees")
      .update(parsed.data)
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update employee";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const { companyId } = await getCompanyContext();

    // 1. Get employee user_id before deletion
    const { data: emp } = await supabase
      .from("employees")
      .select("user_id")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();

    // 2. Delete employee record (cascades to attendance, leave_balances, leaves, payroll)
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // 3. Clean up company_users and auth user if they exist
    if (emp?.user_id) {
      await adminClient.from("company_users").delete()
        .eq("user_id", emp.user_id)
        .eq("company_id", companyId);
      await adminClient.auth.admin.deleteUser(emp.user_id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete employee";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

