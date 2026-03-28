import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyContext } from "@/lib/auth/company-context";
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const { companyId, isAdmin } = await getCompanyContext();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { month, year } = await request.json();

    const supabase = await createClient();

    const { data: entries, error: entriesError } = await supabase
      .from("payroll_entries")
      .select(`
        *,
        employees (
          first_name,
          last_name,
          designation,
          base_salary,
          hra,
          allowances,
          bank_account_number,
          bank_ifsc,
          bank_name,
          departments(name)
        )
      `)
      .eq("company_id", companyId)
      .eq("month", month)
      .eq("year", year)
      .order("created_at", { ascending: true });

    if (entriesError || !entries || entries.length === 0) {
      return NextResponse.json({ error: "No payroll entries found for this period" }, { status: 404 });
    }

    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    const workbook = XLSX.utils.book_new();

    // ─── SHEET 1: Salary Register (Full Summary) ───────────────────────────────
    const summaryData = entries.map((e: any, idx: number) => ({
      'Sr.': idx + 1,
      'EMP ID': e.employee_id?.slice(0, 8).toUpperCase(),
      'Employee Name': `${e.employees?.first_name} ${e.employees?.last_name}`,
      'Department': e.employees?.departments?.name || '',
      'Designation': e.employees?.designation || '',
      'Working Days': e.total_working_days,
      'Days Present': e.days_present,
      'Days Absent': e.total_working_days - e.days_present,
      'Gross Earnings (₹)': Number(e.gross_earnings),
      'PF Deduction (₹)': Number(e.pf_deduction),
      'ESI Deduction (₹)': Number(e.esi_deduction),
      'TDS (₹)': Number(e.tds_deduction),
      'LOP (₹)': Number(e.lop_deduction),
      'Prof Tax (₹)': Number(e.professional_tax),
      'Other Ded (₹)': Number(e.other_deductions),
      'Total Deductions (₹)': Number(e.total_deductions),
      'Net Salary (₹)': Number(e.net_salary),
    }));

    // Totals row
    summaryData.push({
      'Sr.': '' as any,
      'EMP ID': '',
      'Employee Name': 'TOTAL',
      'Department': '',
      'Designation': '',
      'Working Days': '' as any,
      'Days Present': '' as any,
      'Days Absent': '' as any,
      'Gross Earnings (₹)': entries.reduce((s: number, e: any) => s + Number(e.gross_earnings), 0),
      'PF Deduction (₹)': entries.reduce((s: number, e: any) => s + Number(e.pf_deduction), 0),
      'ESI Deduction (₹)': entries.reduce((s: number, e: any) => s + Number(e.esi_deduction), 0),
      'TDS (₹)': entries.reduce((s: number, e: any) => s + Number(e.tds_deduction), 0),
      'LOP (₹)': entries.reduce((s: number, e: any) => s + Number(e.lop_deduction), 0),
      'Prof Tax (₹)': entries.reduce((s: number, e: any) => s + Number(e.professional_tax), 0),
      'Other Ded (₹)': entries.reduce((s: number, e: any) => s + Number(e.other_deductions), 0),
      'Total Deductions (₹)': entries.reduce((s: number, e: any) => s + Number(e.total_deductions), 0),
      'Net Salary (₹)': entries.reduce((s: number, e: any) => s + Number(e.net_salary), 0),
    });

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [
      { wch: 5 }, { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 18 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 14 },
      { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 16 }, { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Salary Register');

    // ─── SHEET 2: Statutory Deductions (PF + ESI) ─────────────────────────────
    const statutoryData = entries.map((e: any, idx: number) => {
      const basic = Number(e.employees?.base_salary || 0);
      const pfEmployer = Math.min(basic * 0.12, 1800);
      const esiEmployer = Number(e.gross_earnings) <= 21000 ? Number(e.gross_earnings) * 0.0325 : 0;
      return {
        'Sr.': idx + 1,
        'EMP ID': e.employee_id?.slice(0, 8).toUpperCase(),
        'Employee Name': `${e.employees?.first_name} ${e.employees?.last_name}`,
        'Basic Salary (₹)': basic,
        'Gross Salary (₹)': Number(e.gross_earnings),
        'PF Employee (12%) (₹)': Number(e.pf_deduction),
        'PF Employer (12%) (₹)': Number(pfEmployer.toFixed(2)),
        'Total PF (₹)': Number((Number(e.pf_deduction) + pfEmployer).toFixed(2)),
        'ESI Employee (0.75%) (₹)': Number(e.esi_deduction),
        'ESI Employer (3.25%) (₹)': Number(esiEmployer.toFixed(2)),
        'Total ESI (₹)': Number((Number(e.esi_deduction) + esiEmployer).toFixed(2)),
        'Professional Tax (₹)': Number(e.professional_tax),
        'TDS (₹)': Number(e.tds_deduction),
        'Total Statutory (₹)': Number(e.total_deductions),
      };
    });

    const statutorySheet = XLSX.utils.json_to_sheet(statutoryData);
    statutorySheet['!cols'] = Array(14).fill({ wch: 18 });
    XLSX.utils.book_append_sheet(workbook, statutorySheet, 'Statutory Deductions');

    // ─── SHEET 3: Bank Transfer Statement ────────────────────────────────────
    const bankData = entries.map((e: any, idx: number) => ({
      'Sr.': idx + 1,
      'Employee Name': `${e.employees?.first_name} ${e.employees?.last_name}`,
      'Designation': e.employees?.designation || '',
      'Bank Name': e.employees?.bank_name || 'N/A',
      'Account Number': e.employees?.bank_account_number || 'N/A',
      'IFSC Code': e.employees?.bank_ifsc || 'N/A',
      'Transfer Amount (₹)': Number(e.net_salary),
      'Remarks': `Salary ${monthName} ${year}`,
    }));

    const bankSheet = XLSX.utils.json_to_sheet(bankData);
    bankSheet['!cols'] = [
      { wch: 5 }, { wch: 22 }, { wch: 18 }, { wch: 18 },
      { wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(workbook, bankSheet, 'Bank Transfer');

    // ─── SHEET 4: Attendance Summary ─────────────────────────────────────────
    const attendanceData = entries.map((e: any, idx: number) => ({
      'Sr.': idx + 1,
      'Employee Name': `${e.employees?.first_name} ${e.employees?.last_name}`,
      'Department': e.employees?.departments?.name || '',
      'Total Working Days': e.total_working_days,
      'Days Present': e.days_present,
      'Days Absent': e.total_working_days - e.days_present,
      'LOP Days': e.lop_deduction > 0 ? (e.lop_deduction / (Number(e.gross_earnings) / e.total_working_days)).toFixed(1) : 0,
      'LOP Deduction (₹)': Number(e.lop_deduction),
      'Attendance %': `${Math.round((e.days_present / e.total_working_days) * 100)}%`,
    }));

    const attendanceSheet = XLSX.utils.json_to_sheet(attendanceData);
    attendanceSheet['!cols'] = [
      { wch: 5 }, { wch: 22 }, { wch: 16 }, { wch: 16 },
      { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance Summary');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Payroll_AskTech_${monthName}_${year}.xlsx"`
      }
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate Excel" },
      { status: 500 }
    );
  }
}
