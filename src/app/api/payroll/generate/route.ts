import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";

export async function POST(request: Request) {
  try {
    const { companyId, isAdmin } = await getCompanyContext();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { month, year } = await request.json().catch(() => ({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    }));

    const supabase = await createClient();

    // 1. Fetch all employees
    const { data: employees, error: empErr } = await supabase
      .from("employees")
      .select("id, base_salary, hra, allowances, tds_annual_projected, professional_tax")
      .eq("company_id", companyId)
      .in("status", ["active", "notice_period"]);

    if (empErr || !employees) throw new Error("Failed to fetch employees");

    // 2. Fetch attendance for this month to calculate LOP
    // We'll calculate total working days
    const totalWorkingDays = new Date(year, month, 0).getDate();
    const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
    const endStr = `${year}-${String(month).padStart(2, "0")}-${totalWorkingDays}`;

    const { data: attendance } = await supabase
      .from("attendance")
      .select("employee_id, status")
      .eq("company_id", companyId)
      .gte("date", startStr)
      .lte("date", endStr);

    // Group attendance by employee
    const attMap = new Map<string, number>(); // counts ONLY absent days
    const presentMap = new Map<string, number>(); // counts present days
    if (attendance) {
      for (const a of attendance) {
        if (a.status === "ABSENT") {
          attMap.set(a.employee_id, (attMap.get(a.employee_id) || 0) + 1);
        } else if (["PRESENT", "HALF_DAY", "LATE", "EARLY_OUT", "ON_LEAVE", "HOLIDAY", "WEEKEND"].includes(a.status)) {
          // Note: Half Day might be 0.5 present, but we simplify as 1 for now or 0.5 if strict.
          // For simplicity, any non-absent status is paid.
          presentMap.set(a.employee_id, (presentMap.get(a.employee_id) || 0) + 1);
        }
      }
    }

    // 3. Process each employee
    const entries = employees.map((emp) => {
      const base = Number(emp.base_salary || 0);
      const hra = Number(emp.hra || 0);
      const allow = Number(emp.allowances || 0);
      const gross = base + hra + allow;

      const absences = attMap.get(emp.id) || 0;
      const presentDays = presentMap.get(emp.id) || totalWorkingDays; // default to full present if no track

      // LOP Calculation
      const lop = (gross / totalWorkingDays) * absences;

      // Fixed Deductions
      const pf = base * 0.12; // 12% of basic
      const esi = gross <= 21000 ? gross * 0.0075 : 0;
      const tds = Number(emp.tds_annual_projected || 0) / 12;
      const pt = Number(emp.professional_tax || 0);

      const totalDed = pf + esi + tds + pt + lop;
      const net = gross - totalDed;

      return {
        company_id: companyId,
        employee_id: emp.id,
        month,
        year,
        gross_earnings: gross.toFixed(2),
        pf_deduction: pf.toFixed(2),
        esi_deduction: esi.toFixed(2),
        tds_deduction: tds.toFixed(2),
        lop_deduction: lop.toFixed(2),
        professional_tax: pt.toFixed(2),
        other_deductions: 0,
        total_deductions: totalDed.toFixed(2),
        net_salary: net.toFixed(2),
        days_present: presentDays - absences,
        total_working_days: totalWorkingDays,
      };
    });

    // 4. Batch Upsert
    if (entries.length > 0) {
      const { error: upsertErr } = await supabase
        .from("payroll_entries")
        .upsert(entries, { onConflict: "company_id,employee_id,month,year" });
      
      if (upsertErr) throw new Error("Batch insert failed: " + upsertErr.message);
    }

    return NextResponse.json({ success: true, count: entries.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
