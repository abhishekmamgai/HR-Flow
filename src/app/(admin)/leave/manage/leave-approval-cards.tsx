"use client";

import { useState } from "react";

type Leave = {
  id: string;
  employee_id: string;
  from_date: string;
  to_date: string;
  reason: string | null;
  leave_types: { name: string; code: string };
  employees: { first_name: string; last_name: string } | null;
};

export function LeaveApprovalCards({ leaves }: { leaves: Leave[] }) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function handleApprove(leaveId: string) {
    setProcessing(leaveId);
    try {
      const res = await fetch("/api/leave/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leave_id: leaveId, status: "approved" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to approve request");
      showToast("Leave request approved successfully!", "success");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to approve request", "error");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(leaveId: string) {
    const reason = rejectReason[leaveId]?.trim();
    if (!reason) {
      showToast("Please enter a rejection reason before proceeding.", "error");
      return;
    }
    setProcessing(leaveId);
    try {
      const res = await fetch("/api/leave/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          leave_id: leaveId, 
          status: "rejected", 
          rejection_reason: reason 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reject request");
      showToast("Leave request rejected.", "success");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to reject request", "error");
    } finally {
      setProcessing(null);
    }
  }

  if (leaves.length === 0) {
    return (
      <p className="mt-4 rounded-lg p-6 text-center text-sm" style={{ background: "var(--surface-2)", color: "var(--ink-4)" }}>
        No pending leave approvals
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4 relative">
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-2xl font-bold z-50 text-white transition-all transform ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} flex items-center gap-3`}>
          <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
        </div>
      )}
      {leaves.map((l) => {
        const emp = l.employees;
        const name = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
        const busy = processing === l.id;

        return (
          <div
            key={l.id}
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold" style={{ color: "var(--ink-1)" }}>{name}</p>
                <p className="text-sm" style={{ color: "var(--ink-4)" }}>
                  {l.leave_types?.code ?? ""} • {l.from_date} to {l.to_date}
                </p>
                {l.reason && (
                  <p className="mt-2 text-sm" style={{ color: "var(--ink-3)" }}>{l.reason}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <button
                  onClick={() => handleApprove(l.id)}
                  disabled={busy}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: "var(--green)" }}
                >
                  {busy ? "..." : "Approve"}
                </button>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <input
                    type="text"
                    placeholder="Reject reason (required)"
                    value={rejectReason[l.id] ?? ""}
                    onChange={(e) => setRejectReason((s) => ({ ...s, [l.id]: e.target.value }))}
                    className="rounded-lg border px-3 py-2 text-sm md:w-48"
                    style={{ borderColor: "var(--border)" }}
                  />
                  <button
                    onClick={() => handleReject(l.id)}
                    disabled={busy}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: "var(--red)" }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
