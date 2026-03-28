import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getCompanyContext } from "@/lib/auth/company-context";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [Payroll Run] POST received");

    const { companyId, userId, isAdmin } = await getCompanyContext();

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized — admin access required" }, { status: 403 });
    }

    const { month, year } = await request.json();

    if (!month || !year) {
      return NextResponse.json({ error: "Month and year required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Check for existing run
    let existingRun: { id: string; status: string } | null = null;
    try {
      const { data } = await supabase
        .from("payroll_runs")
        .select("id, status")
        .eq("company_id", companyId)
        .eq("month", month)
        .eq("year", year)
        .single();
      existingRun = data;
    } catch {
      // Table may not have this month yet — that's fine
    }

    if (existingRun) {
      return NextResponse.json(
        { error: `Payroll already exists for this month (Status: ${existingRun.status}). Cannot re-run.` },
        { status: 400 }
      );
    }

    // 2. Get active employees
    const { data: employees } = await supabase
      .from("employees")
      .select("id, first_name, last_name, base_salary, hra, allowances, tds_annual_projected, professional_tax, department_id")
      .eq("company_id", companyId)
      .in("status", ["active", "notice_period"]);

    if (!employees || employees.length === 0) {
      return NextResponse.json(
        { error: "No active employees found. Please add employees before running payroll." },
        { status: 400 }
      );
    }

    // 3. Calculate working days (Mon–Fri)
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    let totalWorkingDays = 0;
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dow = new Date(year, month - 1, day).getDay();
      if (dow !== 0 && dow !== 6) totalWorkingDays++;
    }

    // 4. Get attendance records for the month
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${totalDaysInMonth}`;

    const { data: attendance } = await supabase
      .from("attendance")
      .select("employee_id, status")
      .eq("company_id", companyId)
      .gte("date", startDate)
      .lte("date", endDate);

    // 5. Map attendance per employee
    const absentMap = new Map<string, number>();
    const presentMap = new Map<string, number>();

    if (attendance) {
      for (const a of attendance) {
        if (a.status === "ABSENT") {
          absentMap.set(a.employee_id, (absentMap.get(a.employee_id) || 0) + 1);
        } else if (["PRESENT", "HALF_DAY", "LATE", "EARLY_OUT", "ON_LEAVE", "HOLIDAY"].includes(a.status)) {
          presentMap.set(a.employee_id, (presentMap.get(a.employee_id) || 0) + 1);
        }
      }
    }

    // 6. Build payroll entries from REAL DB data
    const payrollEntries: Record<string, unknown>[] = [];
    let totalGross = 0, totalDeductions = 0, totalNet = 0;

    for (const emp of employees) {
      const base = Number(emp.base_salary || 0);
      const hra = Number(emp.hra || 0);
      const allow = Number(emp.allowances || 0);
      const gross = base + hra + allow;

      const absences = absentMap.get(emp.id) || 0;
      const presentDays = presentMap.has(emp.id)
        ? presentMap.get(emp.id)!
        : totalWorkingDays - absences;

      const lop = totalWorkingDays > 0
        ? parseFloat(((gross / totalWorkingDays) * absences).toFixed(2))
        : 0;

      const pf = parseFloat((base * 0.12).toFixed(2));
      const esi = gross <= 21000 ? parseFloat((gross * 0.0075).toFixed(2)) : 0;
      const tds = parseFloat((Number(emp.tds_annual_projected || 0) / 12).toFixed(2));
      const pt = Number(emp.professional_tax || 0);

      const totalDed = parseFloat((pf + esi + tds + pt + lop).toFixed(2));
      const net = parseFloat((gross - totalDed).toFixed(2));

      payrollEntries.push({
        company_id: companyId,
        employee_id: emp.id,
        month,
        year,
        gross_earnings: gross,
        pf_deduction: pf,
        esi_deduction: esi,
        tds_deduction: tds,
        lop_deduction: lop,
        professional_tax: pt,
        other_deductions: 0,
        total_deductions: totalDed,
        net_salary: net,
        days_present: Math.max(presentDays - absences, 0),
        total_working_days: totalWorkingDays,
      });

      totalGross += gross;
      totalDeductions += totalDed;
      totalNet += net;
    }

    // 7. Upsert payroll entries
    const { error: insertError } = await supabase
      .from("payroll_entries")
      .upsert(payrollEntries, { onConflict: "company_id,employee_id,month,year" })
      .select();

    if (insertError) {
      console.error("❌ Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to insert payroll entries: " + insertError.message },
        { status: 500 }
      );
    }

    // 8. Create payroll_runs record with status = 'processing' (NOT locked)
    // Status flow: processing → approved (after admin approves) → locked
    const { error: runError } = await supabase
      .from("payroll_runs")
      .insert({
        company_id: companyId,
        month,
        year,
        status: "processing", // ✅ FIXED: was 'locked', now 'processing' so Approve button shows
        total_employees: employees.length,
        total_gross: parseFloat(totalGross.toFixed(2)),
        total_deductions: parseFloat(totalDeductions.toFixed(2)),
        total_net: parseFloat(totalNet.toFixed(2)),
        created_by: userId
      });

    if (runError) {
      console.warn("⚠️ payroll_runs insert failed (non-critical):", runError.message);
    }

    return NextResponse.json({
      success: true,
      count: payrollEntries.length,
      summary: {
        totalEmployees: employees.length,
        totalGross: parseFloat(totalGross.toFixed(2)),
        totalDeductions: parseFloat(totalDeductions.toFixed(2)),
        totalNet: parseFloat(totalNet.toFixed(2)),
        month,
        year
      }
    });

  } catch (error) {
    console.error("❌ [Payroll Run] Unhandled error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run payroll" },
      { status: 500 }
    );
  }
}
