import { notFound } from "next/navigation";
import { requireEmployee } from "@/lib/auth/require-admin";
import { formatCurrencyInr } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function PayslipPage({ params }: Props) {
  const ctx = await requireEmployee();
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payroll_entries")
    .select("id, employee_id, month, year, gross_earnings, total_deductions, net_salary")
    .eq("id", id)
    .eq("company_id", ctx.companyId)
    .eq("employee_id", ctx.employeeId!)
    .single();

  if (error || !data) notFound();

  const monthName = new Date(data.year, data.month - 1).toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-10 max-w-3xl">
      <header>
        <h1 className="font-display text-4xl font-black text-slate-800 tracking-tight">Payslip Detail</h1>
        <p className="text-slate-500 font-medium font-sans">Statement for {monthName} {data.year}</p>
      </header>

      <section className="surface-card overflow-hidden border-none shadow-2xl">
        <div className="flex items-start justify-between p-10 bg-slate-900 border-none">
          <div className="space-y-1">
            <p className="font-display text-2xl font-black text-white">Monthly Statement</p>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{monthName} {data.year}</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Receipt ID</p>
             <p className="text-xs font-mono font-bold text-white/50">{data.id.slice(0, 13)}</p>
          </div>
        </div>
        
        <div className="p-10 space-y-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Net Salary Credit</p>
            <p className="font-display text-6xl font-black text-green-600 tracking-tighter">
              {formatCurrencyInr(data.net_salary)}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 pt-10 border-t border-slate-100">
            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Gross Earnings</span>
              <span className="text-xl font-black text-slate-800">{formatCurrencyInr(data.gross_earnings)}</span>
            </div>
            
            <div className="flex justify-between items-center bg-red-50/50 p-6 rounded-2xl border border-red-100/30">
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest text-red-500">Total Deductions</span>
                <span className="text-[10px] font-bold text-red-400">Tax, PF & Other</span>
              </div>
              <span className="text-xl font-black text-red-600">
                -{formatCurrencyInr(data.total_deductions)}
              </span>
            </div>
          </div>

          <footer className="pt-10 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
            <span>Ask Tech HR Protocol Digitally Signed</span>
            <button className="text-blue-500 hover:text-blue-700 transition-colors" onClick={() => window.print()}>Print / Export PDF</button>
          </footer>
        </div>
      </section>
    </div>
  );
}
