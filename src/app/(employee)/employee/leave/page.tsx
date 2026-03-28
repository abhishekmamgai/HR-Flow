"use client";

import { useRole } from "@/lib/auth/role-context";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EmployeeLeavePage() {
  const { employeeId, companyId } = useRole();
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [balances, setBalances] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [formData, setFormData] = useState({ leave_type_id: "", from_date: "", to_date: "", reason: "" });
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      if (!employeeId) return;
      
      const [balancesRes, requestsRes] = await Promise.all([
        supabase.from("leave_balances").select("*, leave_types!fk_balances_type(name, code)").eq("employee_id", employeeId),
        supabase.from("leaves").select("*, leave_types!fk_leaves_type(name)").eq("employee_id", employeeId).order("created_at", { ascending: false })
      ]);

      setBalances(balancesRes.data || []);
      setRequests(requestsRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [employeeId, supabase]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.leave_type_id || !formData.from_date || !formData.to_date) return;
    setApplying(true);
    try {
      const res = await fetch("/api/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to apply");
      
      alert("Leave applied successfully!");
      setFormData({ leave_type_id: "", from_date: "", to_date: "", reason: "" });
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <div className="animate-pulse h-64 bg-[var(--surface-2)] rounded-2xl" />;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold" style={{ color: "var(--ink-1)" }}>Leave Management</h1>
        <p className="text-[var(--ink-4)]">Apply for time off and check your balance</p>
      </header>

      {/* Leave Balances */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {balances.map((b: any) => {
          const available = b.total - b.used - b.pending;
          return (
            <div key={b.id} className="surface-card p-6 border-b-4" style={{ borderColor: available > 0 ? "var(--blue)" : "var(--red)" }}>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--ink-4)]">{b.leave_types?.name}</p>
              <div className="mt-4 flex items-end justify-between">
                <p className="text-4xl font-black" style={{ color: "var(--ink-1)" }}>{available}</p>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-[var(--ink-4)]">Total: {b.total} | Used: {b.used}</p>
                  {b.pending > 0 && <p className="text-[10px] font-bold text-[var(--orange)]">Pending: {b.pending}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
        {/* Recent Requests */}
        <section className="surface-card overflow-hidden">
          <p className="border-b px-6 py-4 font-bold" style={{ borderColor: "var(--border)", color: "var(--ink-1)" }}>My Requests</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead style={{ background: "var(--ink-1)", color: "rgba(255,255,255,.7)" }}>
                <tr>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase">Type</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase">From</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase">To</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {requests.map((r: any) => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 font-bold">{r.leave_types?.name}</td>
                    <td className="px-6 py-4">{r.from_date}</td>
                    <td className="px-6 py-4">{r.to_date}</td>
                    <td className="px-6 py-4">
                      <span className="status-chip" style={
                        r.status === 'APPROVED' ? { background: "var(--green-bg)", color: "var(--green)" } :
                        r.status === 'REJECTED' ? { background: "var(--red-bg)", color: "var(--red)" } :
                        { background: "var(--orange-bg)", color: "var(--orange)" }
                      }>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-[var(--ink-4)]">No leave requests yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Apply Form */}
        <section className="surface-card p-6 h-fit bg-[var(--surface-2)] border-none">
          <h3 className="text-lg font-bold mb-6">Quick Apply</h3>
          <form onSubmit={handleApply} className="space-y-4">
             <div>
                <label className="block text-[10px] font-black uppercase text-[var(--ink-4)] mb-1">Leave Type</label>
                <select 
                  required
                  value={formData.leave_type_id}
                  onChange={(e) => setFormData({...formData, leave_type_id: e.target.value})}
                  className="w-full rounded-xl border p-2.5 text-sm" style={{ borderColor: "var(--border)" }}
                >
                  <option value="">Select type...</option>
                  {balances.map((b: any) => (
                    <option key={b.leave_type_id} value={b.leave_type_id}>{b.leave_types?.name}</option>
                  ))}
                </select>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-[var(--ink-4)] mb-1">From Date</label>
                  <input type="date" required value={formData.from_date} onChange={(e) => setFormData({...formData, from_date: e.target.value})} className="w-full rounded-xl border p-2.5 text-sm" style={{ borderColor: "var(--border)" }} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-[var(--ink-4)] mb-1">To Date</label>
                  <input type="date" required value={formData.to_date} onChange={(e) => setFormData({...formData, to_date: e.target.value})} className="w-full rounded-xl border p-2.5 text-sm" style={{ borderColor: "var(--border)" }} />
                </div>
             </div>
             <div>
                <label className="block text-[10px] font-black uppercase text-[var(--ink-4)] mb-1">Reason (Optional)</label>
                <textarea rows={2} value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full rounded-xl border p-2.5 text-sm" style={{ borderColor: "var(--border)" }} placeholder="Reason for leave" />
             </div>
             <button type="submit" disabled={applying} className="w-full bg-[var(--blue)] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-50 hover:bg-[var(--blue-2)] transition-colors">
               {applying ? "Submitting..." : "Submit Leave Request"}
             </button>
             <p className="text-[10px] text-[var(--ink-4)] leading-relaxed italic text-center mt-2">
                * All leave requests must be submitted at least 48 hours in advance for approval.
             </p>
          </form>
        </section>
      </div>
    </div>
  );
}
