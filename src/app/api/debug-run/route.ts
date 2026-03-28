import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Get ANY company first to be safe
    const { data: companies } = await supabase.from("companies").select("id").limit(1);
    if (!companies || companies.length === 0) return NextResponse.json({ error: "No companies found in DB" }, { status: 400 });
    
    const companyId = companies[0].id;
    const month = 3;
    const year = 2026;
    const userId = "admin-test-id";

    console.log("🛠️ [Debug Run] Starting debug payroll run for company:", companyId);

    // 1. Get employees for this company
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("company_id", companyId)
      .limit(10);

    if (empError) return NextResponse.json({ error: "Emp error: " + empError.message }, { status: 500 });
    if (!employees || employees.length === 0) return NextResponse.json({ error: "No employees" }, { status: 400 });

    const entries = employees.map(emp => ({
      company_id: emp.company_id,
      employee_id: emp.id,
      month,
      year,
      gross_earnings: 50000,
      pf_deduction: 1800,
      esi_deduction: 0,
      tds_deduction: 0,
      lop_deduction: 0,
      professional_tax: 200,
      other_deductions: 0,
      total_deductions: 2000,
      net_salary: 48000,
      days_present: 22,
      total_working_days: 22
    }));

    // 2. Try insert
    const { data, error } = await supabase
      .from("payroll_entries")
      .upsert(entries, { onConflict: "company_id,employee_id,month,year" })
      .select();

    if (error) {
      console.error("❌ [Debug Run] Error:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data?.length, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
