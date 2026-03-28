import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = "admin@asktech.in";
const ADMIN_PASSWORD = "AskTech2026!";

export async function POST() {
  try {
    const supabase = createAdminClient();

    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("name", "ASK Tech")
      .limit(1)
      .single();

    let companyId: string;

    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({ name: "ASK Tech" })
        .select("id")
        .single();

      if (companyError || !company) {
        return NextResponse.json({ error: companyError?.message ?? "Failed to create company" }, { status: 500 });
      }
      companyId = company.id;
    }

    let adminUserId: string;
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const adminUser = existingUser?.users?.find((u) => u.email === ADMIN_EMAIL);

    if (adminUser) {
      adminUserId = adminUser.id;
    } else {
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { role: "company_admin", first_login: false }
      });

      if (userError || !newUser.user) {
        return NextResponse.json({ error: userError?.message ?? "Failed to create admin user" }, { status: 500 });
      }
      adminUserId = newUser.user.id;
    }

    await supabase.from("company_users").upsert(
      { company_id: companyId, user_id: adminUserId, role: "company_admin" },
      { onConflict: "company_id,user_id" },
    );

    const { data: depts } = await supabase.from("departments").select("id, name").eq("company_id", companyId);
    const deptMap = new Map((depts ?? []).map((d) => [d.name, d.id]));

    if (!deptMap.has("Engineering")) {
      const { data: eng } = await supabase.from("departments").insert({ company_id: companyId, name: "Engineering" }).select("id").single();
      if (eng) deptMap.set("Engineering", eng.id);
    }
    if (!deptMap.has("Marketing")) {
      const { data: mkt } = await supabase.from("departments").insert({ company_id: companyId, name: "Marketing" }).select("id").single();
      if (mkt) deptMap.set("Marketing", mkt.id);
    }
    if (!deptMap.has("HR")) {
      const { data: hr } = await supabase.from("departments").insert({ company_id: companyId, name: "HR" }).select("id").single();
      if (hr) deptMap.set("HR", hr.id);
    }

    const { data: empList } = await supabase.from("employees").select("id, email").eq("company_id", companyId);
    const empEmails = new Set((empList ?? []).map((e) => e.email));

    const toInsert = [
      { first_name: "Rahul", last_name: "Sharma", email: "rahul@asktech.in", designation: "Senior Developer", dept: "Engineering" },
      { first_name: "Priya", last_name: "Mehta", email: "priya@asktech.in", designation: "Lead Designer", dept: "Marketing" },
      { first_name: "Amit", last_name: "Kumar", email: "amit@asktech.in", designation: "HR Manager", dept: "HR" },
    ];

    const employeeIds: string[] = [];

    for (const emp of toInsert) {
      if (empEmails.has(emp.email)) continue;
      const deptId = deptMap.get(emp.dept) ?? null;
      const { data: inserted } = await supabase
        .from("employees")
        .insert({
          company_id: companyId,
          first_name: emp.first_name,
          last_name: emp.last_name,
          email: emp.email,
          designation: emp.designation,
          department_id: deptId,
          status: "active",
        })
        .select("id")
        .single();
      if (inserted) employeeIds.push(inserted.id);
    }

    const today = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const allEmpIds =
      employeeIds.length > 0
        ? employeeIds
        : ((await supabase.from("employees").select("id").eq("company_id", companyId)).data ?? []).map((e) => e.id);

    // Leave types (CL, EL, SL)
    const { data: existingLt } = await supabase.from("leave_types").select("id").eq("company_id", companyId).limit(1).single();
    let leaveTypeIds: Record<string, string> = {};
    if (!existingLt) {
      const ltInserts = [
        { company_id: companyId, name: "Casual Leave", code: "CL", total_days: 12, paid: true },
        { company_id: companyId, name: "Earned Leave", code: "EL", total_days: 15, paid: true },
        { company_id: companyId, name: "Sick Leave", code: "SL", total_days: 12, paid: true },
      ];
      for (const lt of ltInserts) {
        const { data: ins } = await supabase.from("leave_types").insert(lt).select("id, code").single();
        if (ins) leaveTypeIds[ins.code] = ins.id;
      }
    } else {
      const { data: lts } = await supabase.from("leave_types").select("id, code").eq("company_id", companyId);
      leaveTypeIds = Object.fromEntries((lts ?? []).map((l) => [l.code, l.id]));
    }

    const allEmps = (await supabase.from("employees").select("id").eq("company_id", companyId)).data ?? [];
    const year = today.getFullYear();
    for (const emp of allEmps) {
      for (const [code, ltId] of Object.entries(leaveTypeIds)) {
        const total = code === "CL" ? 12 : code === "EL" ? 15 : 12;
        await supabase.from("leave_balances").upsert(
          { company_id: companyId, employee_id: emp.id, leave_type_id: ltId, year, total, used: 0, pending: 0 },
          { onConflict: "company_id,employee_id,leave_type_id,year" },
        );
      }
    }

    // Create employee user (rahul@asktech.in) for testing
    const EMP_EMAIL = "rahul@asktech.in";
    const EMP_PASSWORD = "Rahul2026!";
    let rahulCode = "";
    const { data: empUser } = await supabase.auth.admin.listUsers();
    const rahulAuth = empUser?.users?.find((u) => u.email === EMP_EMAIL);
    let rahulUserId: string | undefined;
    if (rahulAuth) {
      rahulUserId = rahulAuth.id;
    } else {
      const { data: newEmpUser, error: empUserErr } = await supabase.auth.admin.createUser({
        email: EMP_EMAIL,
        password: EMP_PASSWORD,
        email_confirm: true,
        user_metadata: { role: "employee", first_login: false }
      });
      if (!empUserErr && newEmpUser.user) rahulUserId = newEmpUser.user.id;
    }
    if (rahulUserId) {
      await supabase.from("company_users").upsert(
        { company_id: companyId, user_id: rahulUserId, role: "employee" },
        { onConflict: "company_id,user_id" },
      );
      const rahulEmp = (await supabase.from("employees").select("id, employee_code").eq("company_id", companyId).eq("email", EMP_EMAIL).single()).data;
      if (rahulEmp) {
        await supabase.from("employees").update({ user_id: rahulUserId }).eq("id", rahulEmp.id);
        rahulCode = rahulEmp.employee_code ?? "UNKNOWN";
        
        // Also ensure employee logic is seeded in credentials if needed
        // But employee_login route authenticates with user_id, so this is enough.
      }
    }

    for (let d = 0; d < 7; d++) {
      const dte = new Date(today);
      dte.setDate(dte.getDate() - d);
      const dateStr = dte.toISOString().slice(0, 10);
      const dayName = dayNames[dte.getDay()];
      const isWeekend = dayName === "Sat" || dayName === "Sun";

      for (const empId of allEmpIds) {
        await supabase.from("attendance").upsert(
          {
            company_id: companyId,
            employee_id: empId,
            date: dateStr,
            status: isWeekend ? "WEEKEND" : "PRESENT",
            check_in: isWeekend ? null : `${dateStr}T09:02:00Z`,
            check_out: isWeekend ? null : `${dateStr}T18:00:00Z`,
          },
          { onConflict: "company_id,employee_id,date" },
        );
      }
    }

    // Seed Payroll for March 2026
    for (const empId of allEmpIds) {
      await supabase.from("payroll_entries").upsert({
        company_id: companyId,
        employee_id: empId,
        month: 3,
        year: 2026,
        gross_earnings: 75000,
        total_deductions: 5000,
        net_salary: 70000,
      }, { onConflict: "company_id,employee_id,month,year" });
    }

    return NextResponse.json({
      ok: true,
      message: "Seed complete",
      login: {
        admin: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
        employee: { email: EMP_EMAIL, password: EMP_PASSWORD, code: rahulCode },
      },
      companyId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Seed failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
