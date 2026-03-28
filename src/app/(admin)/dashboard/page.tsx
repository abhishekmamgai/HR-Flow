import Link from "next/link";
import { getDashboardStats, getPendingLeaves, getAttendanceForDate } from "@/lib/hr-data";
import { formatCurrencyInr } from "@/lib/format";
import { redirect } from "next/navigation";
import { getCompanyContext } from "@/lib/auth/company-context";

export default async function DashboardPage() {
  const ctx = await getCompanyContext();
  const today = new Date().toISOString().slice(0, 10);

  if (!ctx.isAdmin) {
    redirect("/employee/dashboard");
  }

  const [stats, pendingLeaves, todayAttendance] = await Promise.all([
    getDashboardStats(today),
    getPendingLeaves(),
    getAttendanceForDate(today),
  ]);

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <section className="relative p-10 md:p-14 rounded-[2rem] border-none shadow-2xl overflow-hidden group min-h-[320px] flex flex-col justify-end">
        {/* Background Image */}
        <div 
           className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[2000ms] ease-out group-hover:scale-105" 
           style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80")' }} 
        />
        {/* Dark overlay spanning bottom-to-top to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/70 to-transparent" />
        
        <div className="relative z-10 mt-auto drop-shadow-2xl">
          <p className="text-[11px] uppercase tracking-[0.3em] font-black text-white/60 mb-3 drop-shadow-md">System Overview</p>
          <h1 className="font-display text-5xl md:text-6xl font-black text-white leading-tight tracking-tight">
            Administrator <span className="text-[#60a5fa] drop-shadow-[0_0_15px_rgba(96,165,250,0.4)]">Dashboard</span>
          </h1>
          <p className="mt-4 text-white/90 font-medium max-w-2xl text-base md:text-lg leading-relaxed">
            Monitor real-time attendance, manage pending requests, and oversee department performance.
          </p>
        </div>
      </section>

      {/* KPI Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Employees", value: stats.totalEmployees, sub: "Total base", icon: "👥" },
          { label: "Present", value: stats.presentToday, sub: "Marked today", icon: "✅", color: "var(--green)" },
          { label: "On Leave", value: stats.onLeaveToday, sub: "Approved", icon: "🏖", color: "var(--orange)" },
          { label: "Pending", value: stats.pendingLeaveApprovals, sub: "Leave requests", icon: "⏳", color: "var(--blue)" },
          { label: "Payroll", value: formatCurrencyInr(stats.monthlyPayrollCost), sub: "Monthly cost", icon: "💰" },
        ].map((kpi) => (
          <article key={kpi.label} className="surface-card p-6 hover:translate-y-[-4px] transition-all cursor-default">
            <div className="flex items-center justify-between mb-4">
               <span className="text-lg">{kpi.icon}</span>
               <span className="text-[10px] font-black uppercase tracking-widest text-[var(--ink-4)]">{kpi.label}</span>
            </div>
            <p className="text-3xl font-black" style={{ color: kpi.color || "var(--ink-1)" }}>{kpi.value}</p>
            <p className="text-[10px] font-bold text-[var(--ink-4)] mt-1">{kpi.sub}</p>
          </article>
        ))}
      </section>

      {/* Lists Section */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Pending Leaves */}
        <article className="surface-card p-0 overflow-hidden border-none shadow-xl">
          <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-bold text-lg">Pending Leave Requests</h3>
            <Link href="/leave/manage" className="text-xs font-black uppercase text-[var(--blue)] hover:underline">View All &rarr;</Link>
          </div>
          <div className="p-4 space-y-3">
            {pendingLeaves.length === 0 ? (
              <div className="p-8 text-center text-[var(--ink-4)] bg-[var(--surface-2)] rounded-2xl italic font-medium">No pending leave requests</div>
            ) : (
              pendingLeaves.slice(0, 5).map((l: any) => (
                <div key={l.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-[var(--border)] group hover:border-[var(--blue)]/30 transition-all">
                   <div>
                      <p className="font-bold text-sm">{l.employees?.first_name} {l.employees?.last_name}</p>
                      <p className="text-[10px] font-bold text-[var(--ink-4)] uppercase mt-1">
                        {l.leave_types?.name} &bull; {l.from_date}
                      </p>
                   </div>
                   <Link href="/leave/manage" className="px-4 py-2 bg-[var(--blue-bg)] text-[var(--blue)] text-[10px] font-black uppercase rounded-lg group-hover:bg-[var(--blue)] group-hover:text-white transition-all">Review</Link>
                </div>
              ))
            )}
          </div>
        </article>

        {/* Live Attendance */}
        <article className="surface-card p-0 overflow-hidden border-none shadow-xl">
           <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-bold text-lg">Today&apos;s Attendance</h3>
            <Link href="/attendance" className="text-xs font-black uppercase text-[var(--blue)] hover:underline">Full Report &rarr;</Link>
          </div>
          <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
             {todayAttendance.length === 0 ? (
                <div className="p-8 text-center text-[var(--ink-4)] bg-[var(--surface-2)] rounded-2xl italic font-medium">No one has checked in yet today</div>
             ) : (
                todayAttendance.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 border-b" style={{ borderColor: "var(--border)" }}>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-4)] font-bold text-xs">
                          {a.employees?.first_name?.[0]}
                        </div>
                        <span className="text-sm font-medium">{a.employees?.first_name} {a.employees?.last_name}</span>
                     </div>
                     <span className="status-chip text-[10px]" style={
                       a.status === 'PRESENT' || a.status === 'LATE' ? { background: "var(--green-bg)", color: "var(--green)" } :
                       { background: "var(--surface-2)", color: "var(--ink-4)" }
                     }>
                       {a.status}
                     </span>
                  </div>
                ))
             )}
          </div>
        </article>
      </section>
    </div>
  );
}
