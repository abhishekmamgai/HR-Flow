import { requireAdmin } from "@/lib/auth/require-admin";
import { getAttendanceForDate } from "@/lib/hr-data";
import { formatTime, formatHours } from "@/lib/utils/format";
import { redirect } from "next/navigation";
import { getCompanyContext } from "@/lib/auth/company-context";

export default async function AttendancePage() {
  const ctx = await getCompanyContext();
  if (!ctx.isAdmin) {
    redirect("/employee/dashboard");
  }

  const today = new Date().toISOString().slice(0, 10);
  const attendance = await getAttendanceForDate(today);

  const stats = {
    present: attendance.filter(a => a.status === 'PRESENT').length,
    late: attendance.filter(a => a.status === 'LATE').length,
    absent: attendance.filter(a => a.status === 'ABSENT').length,
    total: attendance.length
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-slate-800">Attendance Log</h1>
          <p className="mt-1 text-slate-500 font-medium">Daily register for Ask Tech • {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="surface-card p-5 border-l-4 border-l-blue-500">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Registered</p>
            <p className="text-3xl font-black mt-1 text-slate-800">{stats.total}</p>
         </div>
         <div className="surface-card p-5 border-l-4 border-l-green-500">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Present (On-Time)</p>
            <p className="text-3xl font-black mt-1 text-green-600">{stats.present}</p>
         </div>
         <div className="surface-card p-5 border-l-4 border-l-orange-500">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Late In</p>
            <p className="text-3xl font-black mt-1 text-orange-600">{stats.late}</p>
         </div>
         <div className="surface-card p-5 border-l-4 border-l-red-500">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unaccounted / Absent</p>
            <p className="text-3xl font-black mt-1 text-red-600">{stats.absent}</p>
         </div>
      </div>

      <article className="surface-card border-none shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800 text-white/70">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Shift Check-In</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Shift Check-Out</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No attendance records for today yet.</td>
                </tr>
              ) : (
                attendance.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{a.employees?.first_name} {a.employees?.last_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{a.employees?.employee_code}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`font-mono font-bold ${a.check_in ? 'text-green-600' : 'text-slate-300'}`}>
                         {a.check_in ? formatTime(a.check_in) : '--:-- --'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`font-mono font-bold ${a.check_out ? 'text-blue-600' : 'text-slate-300'}`}>
                         {a.check_out ? formatTime(a.check_out) : '--:-- --'}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="status-chip text-[10px]" style={
                        a.status === 'PRESENT' ? { background: "var(--green-bg)", color: "var(--green)" } :
                        a.status === 'LATE' ? { background: "var(--orange-bg)", color: "var(--orange)" } :
                        { background: "var(--surface-2)", color: "var(--ink-4)" }
                      }>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-black text-slate-600">
                       {a.total_hours ? formatHours(a.total_hours) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
