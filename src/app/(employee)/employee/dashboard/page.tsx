"use client";

import { useRole } from "@/lib/auth/role-context";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatTime, formatHours } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import type { AttendanceRow, LeaveBalanceRow } from "@/lib/db/types";

interface DashboardStats {
  attendance: AttendanceRow | null;
  present: number;
  onLeave: number;
  absent: number;
  leaves: (LeaveBalanceRow & { leave_types?: { name: string } })[];
}

export default function EmployeeDashboardPage() {
  const { firstName, employeeCode, employeeId } = useRole();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timer, setTimer] = useState("0h 0m");
  const supabase = createClient();

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    async function fetchData() {
      if (!employeeId) return;
      
      const todayIso = new Date().toISOString().slice(0, 10);
      
      // Fetch attendance and stats
      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("date", todayIso)
        .maybeSingle();

      // Fetch monthly summary
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      const { data: monthlyData } = await supabase
        .from("attendance")
        .select("status")
        .eq("employee_id", employeeId)
        .gte("date", firstDay);

      // Fetch leave balances
      const { data: leaves } = await supabase
        .from("leave_balances")
        .select("*, leave_types!fk_balances_type(name)")
        .eq("employee_id", employeeId);

      // Fetch active monthly leaves
      const { data: monthlyLeaves } = await supabase
        .from("leaves")
        .select("from_date, to_date")
        .eq("employee_id", employeeId)
        .eq("status", "approved")
        .gte("to_date", firstDay);

      let leaveDaysThisMonth = 0;
      if (monthlyLeaves) {
        const monthStart = new Date(firstDay);
        const nextMonth = new Date(monthStart);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        for (const l of monthlyLeaves) {
          const from = new Date(l.from_date);
          const to = new Date(l.to_date);
          const overlapStart = from < monthStart ? monthStart : from;
          const overlapEnd = to >= nextMonth ? new Date(nextMonth.getTime() - 86400000) : to;
          
          if (overlapStart <= overlapEnd) {
            leaveDaysThisMonth += Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1;
          }
        }
      }

      const present = monthlyData?.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length || 0;
      const onLeave = (monthlyData?.filter(a => a.status === 'ON_LEAVE').length || 0) + leaveDaysThisMonth;
      const absent = monthlyData?.filter(a => a.status === 'ABSENT').length || 0;

      setStats({
        attendance,
        present,
        onLeave,
        absent,
        leaves: leaves || []
      });
      setLoading(false);
    }
    fetchData();
  }, [employeeId, supabase]);

  // Timer logic for In Office state
  useEffect(() => {
    if (stats?.attendance?.check_in && !stats?.attendance?.check_out) {
      const interval = setInterval(() => {
        const checkIn = new Date(`${new Date().toISOString().slice(0, 10)}T${stats.attendance!.check_in}`);
        const now = new Date();
        const diffMs = now.getTime() - checkIn.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setTimer(`${diffHrs}h ${diffMins}m`);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [stats]);

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-10 w-48 bg-[var(--surface-2)] rounded-lg" />
      <div className="h-64 bg-[var(--surface-2)] rounded-2xl" />
    </div>;
  }

  const attendance = stats?.attendance;

  return (
    <div className="max-w-4xl space-y-10">
      {/* SECTION 1 — Header */}
      <section>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-4xl font-bold tracking-tight" style={{ color: "var(--ink-1)" }}>
            Good morning, {firstName}! 👋
          </h1>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--surface-2)] text-[var(--ink-4)] uppercase tracking-wider">
            {employeeCode}
          </span>
        </div>
        <p className="mt-2 text-[var(--ink-4)] font-medium">
          {dateStr}
        </p>
      </section>

      {/* SECTION 2 — Today's Attendance Card */}
      <section className="surface-card overflow-hidden p-0 border-none shadow-xl">
        <div className="p-8">
          {!attendance?.check_in ? (
            /* State A — Not checked in yet */
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚪</span>
                <h2 className="text-xl font-bold" style={{ color: "var(--ink-1)" }}>Today&apos;s Attendance</h2>
              </div>
              <p style={{ color: "var(--ink-3)" }}>You have not checked in yet. Please use face recognition to mark your attendance.</p>
              <Link
                href="/face-id?mode=attend"
                className="flex items-center justify-center gap-3 w-full rounded-2xl font-bold text-white transition-all transform hover:scale-[1.01] active:scale-[0.98]"
                style={{ background: "var(--purple)", height: 52, boxShadow: "0 4px 14px 0 rgba(147, 51, 234, 0.39)" }}
              >
                📸 Check In with Face Recognition
              </Link>
            </div>
          ) : attendance.check_in && !attendance.check_out ? (
            /* State B — Checked in, not checked out */
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-pulse">🟡</span>
                <h2 className="text-xl font-bold" style={{ color: "var(--ink-1)" }}>Currently In Office</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-[var(--surface-2)] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-4)]">Checked In At</p>
                  <p className="mt-1 text-2xl font-black text-[var(--ink-1)]">{formatTime(attendance.check_in)}</p>
                </div>
                <div className="rounded-xl bg-[var(--blue-bg)] p-4 border border-[var(--blue)]/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--blue)]">Duration</p>
                  <p className="mt-1 text-2xl font-black text-[var(--blue)]">{timer}</p>
                </div>
              </div>
              <Link
                href="/face-id?mode=attend"
                className="flex items-center justify-center gap-3 w-full rounded-2xl font-bold text-white transition-all transform hover:scale-[1.01] active:scale-[0.98]"
                style={{ background: "var(--blue)", height: 52, boxShadow: "0 4px 14px 0 rgba(37, 99, 235, 0.39)" }}
              >
                📸 Check Out with Face Recognition
              </Link>
            </div>
          ) : (
            /* State C — Both done */
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <h2 className="text-xl font-bold" style={{ color: "var(--ink-1)" }}>Day Complete</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl bg-[var(--surface-2)] p-4">
                  <p className="text-xs font-bold" style={{ color: "var(--ink-4)" }}>In</p>
                  <p className="mt-1 font-bold">{formatTime(attendance.check_in)}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-4">
                  <p className="text-xs font-bold" style={{ color: "var(--ink-4)" }}>Out</p>
                  <p className="mt-1 font-bold">{formatTime(attendance.check_out)}</p>
                </div>
                <div className="rounded-xl bg-[var(--green-bg)] p-4 border border-[var(--green)]/10">
                  <p className="text-xs font-bold" style={{ color: "var(--green)" }}>Total</p>
                  <p className="mt-1 font-bold">{formatHours(attendance.total_hours || 0)}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-4">
                  <p className="text-xs font-bold" style={{ color: "var(--ink-4)" }}>Status</p>
                  <p className="mt-1 font-bold text-xs">{attendance.status}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3 — This Month Summary */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--ink-4)" }}>This Month Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="surface-card p-4 text-center border-b-4 border-b-[var(--green)]">
            <p className="text-3xl font-black text-[var(--green)]">{stats?.present || 0}</p>
            <p className="text-[10px] font-bold uppercase mt-1 text-[var(--ink-4)]">✅ Present</p>
          </div>
          <div className="surface-card p-4 text-center border-b-4 border-b-[var(--red)]">
            <p className="text-3xl font-black text-[var(--red)]">{stats?.absent || 0}</p>
            <p className="text-[10px] font-bold uppercase mt-1 text-[var(--ink-4)]">❌ Absent</p>
          </div>
          <div className="surface-card p-4 text-center border-b-4 border-b-[var(--orange)]">
            <p className="text-3xl font-black text-[var(--orange)]">{stats?.onLeave || 0}</p>
            <p className="text-[10px] font-bold uppercase mt-1 text-[var(--ink-4)]">🏖 On Leave</p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Leave Balance */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--ink-4)" }}>Leave Balance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats?.leaves.map((l: any) => {
            const available = l.total - l.used - l.pending;
            return (
              <div key={l.leave_type_id} className="surface-card p-5">
                <p className="font-bold text-[var(--ink-1)]">{l.leave_types?.name || l.leave_type_id}</p>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-2xl font-black" style={{ color: "var(--blue)" }}>{available}</p>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[var(--ink-4)]">Total: {l.total} | Used: {l.used}</p>
                    {l.pending > 0 && <p className="text-[10px] font-bold text-[var(--orange)]">Pending: {l.pending}</p>}
                  </div>
                </div>
              </div>
            );
          })}
          {(!stats || stats.leaves.length === 0) && (
             <div className="col-span-3 text-center p-8 border-2 border-dashed rounded-2xl" style={{ borderColor: "var(--border)" }}>
               <p className="text-sm font-medium text-[var(--ink-4)]">No leave balances found</p>
             </div>
          )}
        </div>
      </section>

      {/* SECTION 5 — Quick Actions */}
      <section className="flex flex-wrap gap-4">
        <Link 
          href="/employee/leave" 
          className="flex-1 min-w-[200px] surface-card p-6 flex items-center justify-between hover:border-[var(--blue)] transition-all group"
        >
          <span className="font-bold text-lg">Apply Leave</span>
          <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
        </Link>
        <Link 
          href="/employee/attendance" 
          className="flex-1 min-w-[200px] surface-card p-6 flex items-center justify-between hover:border-[var(--blue)] transition-all group"
        >
          <span className="font-bold text-lg">View My Attendance</span>
          <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </section>
    </div>
  );
}
