import { requireAdmin } from "@/lib/auth/require-admin";
import Link from "next/link";

export default async function AdminLeavePage() {
  await requireAdmin();
  
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
         <div>
            <h1 className="font-display text-4xl font-bold text-slate-800">Leave Management</h1>
            <p className="text-slate-500 font-medium">Configure leave types, policies and view department-wise trends.</p>
         </div>
         <Link href="/leave/manage" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
           Review Pending Requests
         </Link>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <article className="surface-card p-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Active Policies</h3>
            <div className="space-y-4">
               {['Sick Leave (12)', 'Paid Time Off (18)', 'Maternity Leave (90)'].map(l => (
                 <div key={l} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700">{l}</span>
                    <button className="text-[10px] font-black text-blue-600 uppercase">Edit</button>
                 </div>
               ))}
            </div>
         </article>

         <article className="surface-card p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-2xl mb-4">📅</div>
            <p className="font-bold text-slate-700">Leave Calendar</p>
            <p className="text-xs text-slate-500 mt-2">Visual calendar view for tracking team leaves across months.</p>
            <button className="mt-4 text-orange-600 font-bold text-sm">Open Calendar →</button>
         </article>
      </section>
    </div>
  );
}
