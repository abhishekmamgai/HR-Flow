import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";
import { requireAdmin } from "@/lib/auth/require-admin";
import { calculateSalary } from "@/lib/salary-calculator";

const schema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  workingDays: z.number().min(1).max(31),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { month, year, workingDays } = parsed.data;
    const supabase = await createClient();
    const { companyId } = await getCompanyContext();

    // 1. Get all active employees
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "active");

    if (empError) throw empError;

    // 2. Get attendance for the month
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().slice(0, 10);

    const { data: attendance, error: attError } = await supabase
      .from("attendance")
      .select("employee_id, status")
      .eq("company_id", companyId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (attError) throw attError;

    // 3. Process each employee
    const results = [];
    for (const emp of employees) {
      const empAtt = attendance.filter(a => a.employee_id === emp.id);
      const presentDays = empAtt.filter(a => ["PRESENT", "LATE", "EARLY_OUT", "HALF_DAY"].includes(a.status)).length;
      const onLeaveDays = empAtt.filter(a => a.status === "ON_LEAVE").length;
      const absentDays = workingDays - presentDays - onLeaveDays;

      const breakdown = calculateSalary({
        monthly_salary: Number(emp.base_salary) || 0,
        total_working_days: workingDays,
        days_present: presentDays,
        days_absent: absentDays,
        lop_days: Math.max(absentDays - onLeaveDays, 0),
        performance_bonus: 0,
        overtime_hours: 0,
        state: 'delhi'
      });

      results.push({
        employee_id: emp.id,
        month,
        year,
        gross_earnings: breakdown.gross_salary,
        pf_employee: breakdown.pf_employee,
        esi: breakdown.esi,
        professional_tax: breakdown.professional_tax,
        total_deductions: breakdown.total_deductions,
        net_salary: breakdown.net_salary
      });
    }

    return NextResponse.json({ count: results.length, results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to calculate salary" }, { status: 500 });
  }
}
