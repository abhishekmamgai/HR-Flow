"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = { employeeId: string; employeeName: string };

export function DeleteEmployeeButton({ employeeId, employeeName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    const res = await fetch(`/api/employees/${employeeId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to delete employee");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
    setShowConfirm(false);
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "var(--red)" }}>
          Delete {employeeName}?
        </span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-md px-2 py-1 text-xs font-semibold text-white"
          style={{ background: "var(--red)" }}
        >
          {isPending ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="rounded-md border px-2 py-1 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--ink-3)" }}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="rounded-md border px-2 py-1 text-xs font-medium transition-colors hover:bg-[var(--red-bg)]"
      style={{ borderColor: "var(--border)", color: "var(--red)" }}
      title={`Delete ${employeeName}`}
    >
      🗑️
    </button>
  );
}
