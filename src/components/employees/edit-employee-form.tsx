"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DepartmentRow, EmployeeRow } from "@/lib/db/types";

type Props = { 
  employee: EmployeeRow & { department_name: string | null };
  departments: DepartmentRow[];
};

export function EditEmployeeForm({ employee, departments }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setToast("");
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: fd.get("first_name"),
          last_name: fd.get("last_name"),
          email: fd.get("email"),
          department_id: fd.get("department_id") || null,
          designation: fd.get("designation") || undefined,
          status: fd.get("status"),
          employee_code: fd.get("employee_code"),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update employee");

      setToast("Employee updated successfully");
      setTimeout(() => {
        router.push(`/employees/${employee.id}`);
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update employee");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface-card p-6">
      {toast && (
        <div className="mb-4 rounded-lg p-3 text-sm" style={{ background: "var(--green-bg)", color: "var(--green)" }}>
          {toast}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg p-3 text-sm" style={{ background: "var(--red-bg)", color: "var(--red)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            First name *
          </label>
          <input 
            name="first_name" 
            defaultValue={employee.first_name}
            required 
            className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" 
            style={{ borderColor: "var(--border)", minHeight: 44 }} 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Last name *
          </label>
          <input 
            name="last_name" 
            defaultValue={employee.last_name}
            required 
            className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" 
            style={{ borderColor: "var(--border)", minHeight: 44 }} 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Email *
          </label>
          <input 
            name="email" 
            type="email" 
            defaultValue={employee.email}
            required 
            className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" 
            style={{ borderColor: "var(--border)", minHeight: 44 }} 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Employee Code
          </label>
          <input 
            name="employee_code" 
            defaultValue={employee.employee_code ?? ""}
            required
            className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" 
            style={{ borderColor: "var(--border)", minHeight: 44 }} 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Department
          </label>
          <select 
            name="department_id" 
            defaultValue={employee.department_id ?? ""}
            className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" 
            style={{ borderColor: "var(--border)", minHeight: 44 }}
          >
            <option value="">— Select —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Designation
          </label>
          <input 
            name="designation" 
            defaultValue={employee.designation ?? ""}
            className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" 
            style={{ borderColor: "var(--border)", minHeight: 44 }} 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Status
          </label>
          <select 
            name="status" 
            defaultValue={employee.status}
            className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" 
            style={{ borderColor: "var(--border)", minHeight: 44 }}
          >
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="notice_period">Notice Period</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        <div className="md:col-span-2">
           <p className="mt-2 text-sm font-bold uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>Salary Details (Monthly)</p>
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Base Salary (Basic)
          </label>
          <input name="base_salary" type="number" defaultValue={employee.base_salary} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            HRA
          </label>
          <input name="hra" type="number" defaultValue={employee.hra} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Allowances
          </label>
          <input name="allowances" type="number" defaultValue={employee.allowances} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Annual TDS Projected
          </label>
          <input name="tds_annual_projected" type="number" defaultValue={employee.tds_annual_projected} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Professional Tax
          </label>
          <input name="professional_tax" type="number" defaultValue={employee.professional_tax} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} />
        </div>
        
        <div className="md:col-span-2 flex gap-3 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--blue)", minHeight: 44 }}
          >
            {loading ? "Saving…" : "Update employee"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/employees/${employee.id}`)}
            className="rounded-xl border px-5 py-2.5 text-sm font-semibold"
            style={{ borderColor: "var(--border)", minHeight: 44 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
