"use client";

import { useRole } from "@/lib/auth/role-context";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatTime, formatHours } from "@/lib/utils/format";
import type { AttendanceRow } from "@/lib/db/types";

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "#639922",
  LATE: "#e67e22",
  ABSENT: "#c0392b",
  ON_LEAVE: "#3498db",
  HALF_DAY: "#9b59b6",
  WEEKEND: "#ef4444",
  HOLIDAY: "#3b82f6",
};

export default function EmployeeAttendancePage() {
  const { employeeId } = useRole();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AttendanceRow[]>([]);
  const supabase = createClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    async function fetchData() {
      if (!employeeId) return;
      
      const firstDay = new Date(year, month - 1, 1).toISOString().slice(0, 10);
      const lastDay = new Date(year, month, 0).toISOString().slice(0, 10);

      const { data: monthData } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", employeeId)
        .gte("date", firstDay)
        .lte("date", lastDay);

      setData(monthData || []);
      setLoading(false);
    }
    fetchData();
  }, [employeeId, month, year, supabase]);

  if (loading) return <div className="animate-pulse h-64 bg-[var(--surface-2)] rounded-2xl" />;

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const dateMap = new Map<string, string>(data.map((a) => [a.date, a.status]));
  
  const cells: { date: number; status: string | null }[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push({ date: 0, status: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date: d, status: dateMap.get(dateStr) ?? null });
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold" style={{ color: "var(--ink-1)" }}>My Attendance</h1>
        <p className="text-[var(--ink-4)]">Viewing logs for {new Date(year, month - 1).toLocaleString("default", { month: "long" })} {year}</p>
      </header>

      <section className="surface-card p-8">
        <div className="grid grid-cols-7 gap-3">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-bold uppercase tracking-widest pb-4" style={{ color: "var(--ink-4)" }}>{d}</div>
          ))}
          {cells.map((c, i) => (
            <div
              key={i}
              className={`flex h-12 flex-col items-center justify-center rounded-xl text-sm font-bold transition-all ${
                c.date ? "shadow-sm border border-[var(--border)]/50" : ""
              }`}
              style={{
                background: c.status ? (STATUS_COLORS[c.status] || "var(--surface-2)") : (c.date ? "var(--surface-2)" : "transparent"),
                color: c.status ? "#fff" : "var(--ink-4)",
              }}
            >
              {c.date || ""}
              {c.status && <span className="text-[8px] uppercase mt-0.5 opacity-80">{c.status.slice(0,3)}</span>}
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t flex flex-wrap gap-6 text-xs font-bold uppercase tracking-widest" style={{ borderColor: "var(--border)", color: "var(--ink-4)" }}>
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-[#639922]" /> Present</div>
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-[#c0392b]" /> Absent</div>
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-[#3498db]" /> Leave</div>
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-[#e67e22]" /> Late</div>
        </div>
      </section>

      <section className="surface-card overflow-hidden transition-all hover:shadow-lg">
        <p className="border-b px-6 py-4 font-bold" style={{ borderColor: "var(--border)", color: "var(--ink-1)" }}>Detailed History</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead style={{ background: "var(--ink-1)", color: "rgba(255,255,255,.7)" }}>
              <tr>
                <th className="px-6 py-4 font-bold text-[10px] uppercase">Date</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase">Status</th>
                <th className="px-6 py-4 font-bold text-[10px] uppercase">In</th>
                <th className="px-4 py-4 font-bold text-[10px] uppercase text-center">Out</th>
                <th className="px-4 py-4 font-bold text-[10px] uppercase text-center">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {data.sort((a, b) => b.date.localeCompare(a.date)).map((a) => (
                <tr key={a.id} className="hover:bg-[var(--surface-2)] transition-colors">
                  <td className="px-6 py-4 font-medium text-[var(--ink-1)]">{a.date}</td>
                  <td className="px-6 py-4">
                    <span className="status-chip" style={{ 
                      background: STATUS_COLORS[a.status] + "20", 
                      color: STATUS_COLORS[a.status] || "inherit",
                      borderColor: STATUS_COLORS[a.status] + "40"
                    }}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[var(--green)]">{formatTime(a.check_in)}</td>
                  <td className="px-4 py-4 font-bold text-[var(--blue)] text-center">{formatTime(a.check_out)}</td>
                  <td className="px-4 py-4 font-black text-[var(--ink-2)] text-center">{formatHours(a.total_hours)}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--ink-4)] font-medium italic">No attendance records found for this month.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
