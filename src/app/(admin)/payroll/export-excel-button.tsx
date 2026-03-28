"use client";

import * as XLSX from "xlsx";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ExportExcelButton({ entries }: { entries: any[] }) {
  const handleExport = () => {
    if (!entries || entries.length === 0) {
      alert("No entries to export!");
      return;
    }

    const latestMonth = entries[0]?.month;
    const latestYear = entries[0]?.year;

    const batch = entries.filter((e) => e.month === latestMonth && e.year === latestYear);

    const data = batch.map((e) => ({
      Employee: `${e.employees?.first_name} ${e.employees?.last_name}`,
      Designation: e.employees?.designation || "N/A",
      "Month": e.month,
      "Year": e.year,
      "Days Present": e.days_present,
      "Total Working Days": e.total_working_days,
      "Gross Earnings (INR)": e.gross_earnings,
      "PF Deduction": e.pf_deduction,
      "ESI Deduction": e.esi_deduction,
      "TDS": e.tds_deduction,
      "LOP Deduction": e.lop_deduction,
      "Professional Tax": e.professional_tax,
      "Total Deductions": e.total_deductions,
      "Net Salary (INR)": e.net_salary,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll Batch");
    XLSX.writeFile(wb, `HRFlow_Payroll_${latestMonth}_${latestYear}.xlsx`);
  };

  return (
    <button 
      onClick={handleExport} 
      className="px-4 py-2 border-2 border-green-200 bg-green-50 text-green-700 font-black tracking-wide rounded-xl hover:bg-green-100 hover:border-green-300 transition-all text-[11px] uppercase flex items-center gap-2"
    >
      <span>📊</span> Export Current Batch to Excel
    </button>
  );
}
