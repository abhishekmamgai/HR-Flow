"use client";

import { useState } from "react";
import type { LeaveTypeRow } from "@/lib/db/types";

export function ApplyLeaveForm({ leaveTypes }: { leaveTypes: LeaveTypeRow[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const leave_type_id = fd.get("leave_type_id") as string;
    const from_date = fd.get("from_date") as string;
    const to_date = fd.get("to_date") as string;
    const reason = (fd.get("reason") as string) || undefined;

    if (!leave_type_id || !from_date || !to_date) {
      setMessage({ type: "err", text: "Please fill all required fields" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leave_type_id, from_date, to_date, reason }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to apply");
      }

      setMessage({ type: "ok", text: "Leave applied successfully" });
      form.reset();
      window.location.reload();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="block text-xs" style={{ color: "var(--ink-4)" }}>Leave Type *</label>
        <select
          name="leave_type_id"
          required
          className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)" }}
        >
          <option value="">Select</option>
          {leaveTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>
              {lt.name} ({lt.code})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs" style={{ color: "var(--ink-4)" }}>From Date *</label>
        <input
          type="date"
          name="from_date"
          required
          min={today}
          className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)" }}
        />
      </div>
      <div>
        <label className="block text-xs" style={{ color: "var(--ink-4)" }}>To Date *</label>
        <input
          type="date"
          name="to_date"
          required
          min={today}
          className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)" }}
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs" style={{ color: "var(--ink-4)" }}>Reason (optional)</label>
        <textarea
          name="reason"
          rows={3}
          className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)" }}
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "var(--orange)" }}
        >
          {submitting ? "Applying..." : "Apply Leave"}
        </button>
      </div>
      {message && (
        <p
          className={`rounded-lg p-3 text-sm ${message.type === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
