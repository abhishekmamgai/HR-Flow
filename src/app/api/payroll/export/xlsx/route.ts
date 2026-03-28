import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";
import { requireAdmin } from "@/lib/auth/require-admin";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || "0");
    const year = parseInt(searchParams.get("year") || "0");

    if (!month || !year) {
      return NextResponse.json({ error: "Month and year required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { companyId } = await getCompanyContext();

    const { data: entries, error } = await supabase
      .from("payroll_entries")
      .select(`
        *,
        employees!fk_payroll_employee(first_name, last_name, email, designation, base_salary, employee_code, departments(name))
      `)
      .eq("company_id", companyId)
      .eq("month", month)
      .eq("year", year);

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = entries.map((e: any) => ({
      "Employee Code": e.employees?.employee_code,
      "Name": `${e.employees?.first_name} ${e.employees?.last_name}`,
      "Gross Earnings": e.gross_earnings,
      "PF Deduction": e.pf_deduction,
      "ESI Deduction": e.esi_deduction,
      "TDS Deduction": e.tds_deduction,
      "LOP Deduction": e.lop_deduction,
      "Professional Tax": e.professional_tax,
      "Total Deductions": e.total_deductions,
      "Net Salary": e.net_salary,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=payroll_${month}_${year}.xlsx`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
