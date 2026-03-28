'use client';

import { useCallback, useEffect, useState } from "react";
import { formatCurrencyInr } from "@/lib/format";
import { DownloadPayslipButton } from "./download-payslip-button";

interface PayrollEntry {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  total_working_days: number;
  days_present: number;
  gross_earnings: number;
  pf_deduction: number;
  esi_deduction: number;
  tds_deduction: number;
  lop_deduction: number;
  professional_tax: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  employees?: {
    first_name: string;
    last_name: string;
    designation: string;
    departments?: { name: string };
  };
}

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: 'draft' | 'processing' | 'approved' | 'locked';
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  created_at: string;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function PayrollPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    setEntries([]);
    setRun(null);
    try {
      const res = await fetch(`/api/payroll/fetch?month=${month}&year=${year}`);
      const data = await res.json();
      if (res.ok) {
        setRun(data.run);
        setEntries(data.entries);
      }
    } catch {
      showToast("Failed to fetch payroll data", "error");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const handleRunPayroll = async () => {
    if (!confirm(`Generate payroll for ${MONTHS[month - 1]} ${year}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payroll/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Payroll generated for ${data.summary.totalEmployees} employees ✓`, "success");
        await fetchPayroll();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to generate payroll", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!run) return;
    if (!confirm("Approve and lock this payroll? No changes can be made after approval.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/runs/${run.id}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast("Payroll approved and locked ✓", "success");
        setShowExportModal(true);
        await fetchPayroll();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to approve payroll", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/payroll/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Payroll_AskTech_${MONTHS[month - 1]}_${year}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Excel downloaded ✓", "success");
      } else {
        throw new Error("Export failed");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Export failed", "error");
    } finally {
      setExporting(false);
    }
  };

  const monthName = MONTHS[month - 1];
  const canRunPayroll = !run;
  const canApprove = run?.status === 'processing';
  const isLocked = run?.status === 'approved' || run?.status === 'locked';
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6 pb-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-4 rounded-xl shadow-2xl font-semibold z-50 text-white flex items-center gap-3 transition-all animate-in slide-in-from-bottom-2 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          <span className="text-lg">{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">HRFlow</p>
          <h1 className="font-display text-3xl font-black text-slate-800">Payroll Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Monthly salary processing, statutory deductions & disbursement</p>
        </div>
        {isLocked && (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-black uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Payroll Locked
          </span>
        )}
      </header>

      {/* Controls */}
      <div className="surface-card p-6 shadow-md rounded-2xl border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex gap-3 flex-1">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="border border-slate-200 rounded-lg px-3 py-2.5 font-semibold text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="border border-slate-200 rounded-lg px-3 py-2.5 font-semibold text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            {canRunPayroll && (
              <button
                onClick={handleRunPayroll}
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                ) : (
                  <><span>⚡</span> Run Payroll</>
                )}
              </button>
            )}

            {canApprove && (
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <span>✓</span> Approve & Lock
              </button>
            )}

            {entries.length > 0 && (
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {exporting ? 'Exporting...' : <><span>📊</span> Excel</>}
              </button>
            )}

            {entries.length > 0 && (
              <button
                onClick={() => setShowExportModal(true)}
                className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <span>📥</span> Export
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && entries.length === 0 && (
        <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
          <span className="w-5 h-5 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
          <span className="font-semibold text-sm">Loading payroll data...</span>
        </div>
      )}

      {/* No data state */}
      {!loading && entries.length === 0 && (
        <div className="surface-card rounded-2xl border border-dashed border-slate-200 p-16 text-center">
          <div className="text-5xl mb-4">💰</div>
          <p className="text-slate-700 font-bold text-lg mb-1">No payroll for {monthName} {year}</p>
          <p className="text-slate-400 text-sm mb-6">Run payroll to calculate salaries based on attendance data</p>
          {canRunPayroll && (
            <button
              onClick={handleRunPayroll}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              ⚡ Run Payroll Now
            </button>
          )}
        </div>
      )}

      {/* Summary Cards */}
      {run && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="surface-card p-5 rounded-2xl border-l-4 border-l-blue-500 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Employees</p>
            <p className="text-3xl font-black mt-2 text-slate-800">{run.total_employees}</p>
            <p className="text-xs text-slate-400 mt-1">{monthName} {year}</p>
          </div>
          <div className="surface-card p-5 rounded-2xl border-l-4 border-l-green-500 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gross Payable</p>
            <p className="text-xl font-black mt-2 text-green-600">{formatCurrencyInr(run.total_gross)}</p>
            <p className="text-xs text-slate-400 mt-1">Before deductions</p>
          </div>
          <div className="surface-card p-5 rounded-2xl border-l-4 border-l-red-400 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Deductions</p>
            <p className="text-xl font-black mt-2 text-red-500">-{formatCurrencyInr(run.total_deductions)}</p>
            <p className="text-xs text-slate-400 mt-1">PF + ESI + TDS + LOP</p>
          </div>
          <div className="surface-card p-5 rounded-2xl border-l-4 border-l-purple-500 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Disbursement</p>
            <p className="text-xl font-black mt-2 text-purple-600">{formatCurrencyInr(run.total_net)}</p>
            <p className="text-xs text-slate-400 mt-1">Take-home total</p>
          </div>
        </section>
      )}

      {/* Payroll Table */}
      {entries.length > 0 && (
        <article className="surface-card rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div>
              <p className="font-black text-slate-800 text-sm">{monthName} {year} — Salary Register</p>
              <p className="text-xs text-slate-400 mt-0.5">{entries.length} employees processed</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              isLocked ? 'bg-emerald-100 text-emerald-700' :
              run?.status === 'processing' ? 'bg-amber-100 text-amber-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {run?.status}
            </span>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 text-white/60">
                <tr>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest">#</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest">Employee</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-center">Days</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-right">Gross</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-right">PF</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-right">ESI</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-right">TDS</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-right">LOP</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-right">Total Ded.</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-right">Net Pay</th>
                  <th className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-center">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entries.map((e, idx) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-xs text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">{e.employees?.first_name} {e.employees?.last_name}</p>
                      <p className="text-xs text-slate-400">{e.employees?.designation} · {e.employees?.departments?.name}</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        e.days_present === e.total_working_days
                          ? 'bg-green-100 text-green-700'
                          : e.days_present < e.total_working_days * 0.6
                          ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}>
                        {e.days_present}/{e.total_working_days}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-700">{formatCurrencyInr(e.gross_earnings)}</td>
                    <td className="px-5 py-4 text-right text-xs text-slate-500">{formatCurrencyInr(e.pf_deduction)}</td>
                    <td className="px-5 py-4 text-right text-xs text-slate-500">{formatCurrencyInr(e.esi_deduction)}</td>
                    <td className="px-5 py-4 text-right text-xs text-slate-500">{formatCurrencyInr(e.tds_deduction)}</td>
                    <td className="px-5 py-4 text-right text-xs text-red-400">
                      {e.lop_deduction > 0 ? `-${formatCurrencyInr(e.lop_deduction)}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-red-500">-{formatCurrencyInr(e.total_deductions)}</td>
                    <td className="px-5 py-4 text-right font-black text-slate-900">{formatCurrencyInr(e.net_salary)}</td>
                    <td className="px-5 py-4 text-center">
                      <DownloadPayslipButton entry={e} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={3} className="px-5 py-4 font-black text-slate-600 text-sm">TOTAL ({entries.length} employees)</td>
                  <td className="px-5 py-4 text-right font-black text-slate-800">{formatCurrencyInr(run?.total_gross ?? 0)}</td>
                  <td colSpan={4} />
                  <td className="px-5 py-4 text-right font-black text-red-500">-{formatCurrencyInr(run?.total_deductions ?? 0)}</td>
                  <td className="px-5 py-4 text-right font-black text-purple-700 text-base">{formatCurrencyInr(run?.total_net ?? 0)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </article>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📥</div>
              <p className="text-xl font-black text-slate-800">Export Payroll</p>
              <p className="text-slate-500 text-sm mt-1">{monthName} {year} · {entries.length} employees</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="w-full p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors text-left flex items-center gap-4 disabled:opacity-50"
              >
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Excel Export</p>
                  <p className="text-xs text-slate-500">Summary + Deductions + PF Register + Bank Transfer sheets</p>
                </div>
              </button>

              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Individual Payslips (PDF)</p>
                    <p className="text-xs text-slate-500">Download per employee from the table above</p>
                  </div>
                </div>
                <p className="text-xs text-blue-600 font-semibold">→ Click "PDF" button in each row</p>
              </div>
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              className="w-full px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
