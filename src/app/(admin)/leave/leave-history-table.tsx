"use client";

import { useState } from "react";

type LeaveRow = {
  id: string;
  from_date: string;
  to_date: string;
  reason: string | null;
  status: string;
  leave_types: { name: string; code: string };
};

export function LeaveHistoryTable({ leaves }: { leaves: LeaveRow[] }) {
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  async function handleWithdraw(leaveId: string) {
    setWithdrawing(leaveId);
    try {
      const res = await fetch("/api/leave/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leave_id: leaveId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setWithdrawing(null);
    }
  }

  const statusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return { color: "var(--orange)", background: "var(--orange-bg)" };
      case "approved":
        return { color: "var(--green)", background: "var(--green-bg)" };
      case "rejected":
        return { color: "var(--red)", background: "var(--red-bg)" };
      default:
        return { color: "var(--ink-4)", background: "var(--surface-2)" };
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead style={{ background: "var(--ink-1)", color: "rgba(255,255,255,.75)" }}>
          <tr>
            <th className="px-4 py-3 text-xs uppercase tracking-widest">Type</th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest">From</th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest">To</th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest">Reason</th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest">Status</th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest">Action</th>
          </tr>
        </thead>
        <tbody>
          {leaves.length === 0 ? (
            <tr>
              <td className="px-4 py-6" colSpan={6} style={{ color: "var(--ink-4)" }}>
                No leave applications yet
              </td>
            </tr>
          ) : (
            leaves.map((l, i) => (
              <tr
                key={l.id}
                className="border-b"
                style={{ background: i % 2 ? "var(--surface-2)" : "var(--surface)", borderColor: "var(--border)" }}
              >
                <td className="px-4 py-3">{l.leave_types?.code ?? "-"}</td>
                <td className="px-4 py-3">{l.from_date}</td>
                <td className="px-4 py-3">{l.to_date}</td>
                <td className="px-4 py-3 max-w-[200px] truncate">{l.reason ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className="status-chip text-xs" style={statusStyle(l.status)}>
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {l.status === "pending" && (
                    <button
                      onClick={() => handleWithdraw(l.id)}
                      disabled={!!withdrawing}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {withdrawing === l.id ? "..." : "Withdraw"}
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
