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
          phone: fd.get("phone") || undefined,
          department_id: fd.get("department_id") || null,
          designation: fd.get("designation") || undefined,
          employment_type: fd.get("employment_type") || "full_time",
          status: fd.get("status") || "active",
          base_salary: fd.get("base_salary"),
          hra: fd.get("hra"),
          allowances: fd.get("allowances"),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update employee");

      setToast("Employee updated successfully! Redirecting...");
      setTimeout(() => {
        router.push(`/employees/${employee.id}`);
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update employee");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface-card p-6">
      {error && (
        <div className="mb-4 rounded-lg p-3 text-sm bg-red-50 text-red-600 border border-red-100 font-medium">
          {error}
        </div>
      )}
      {toast && (
        <div className="mb-4 rounded-lg p-3 text-sm bg-green-50 text-green-600 border border-green-100 font-bold">
          {toast}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
           <p className="text-sm font-black uppercase tracking-widest text-slate-400">Personal Information</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">First name *</label>
          <input name="first_name" required defaultValue={employee.first_name} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Last name *</label>
          <input name="last_name" required defaultValue={employee.last_name} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email *</label>
          <input name="email" type="email" required defaultValue={employee.email} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone</label>
          <input name="phone" type="tel" defaultValue={employee.phone || ""} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
        </div>
        
        <div className="md:col-span-2 pt-6 border-t border-slate-50">
           <p className="text-sm font-black uppercase tracking-widest text-slate-400">Employment & Access</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Department</label>
          <select name="department_id" defaultValue={employee.department_id || ""} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
            <option value="">— Select —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Designation</label>
          <input name="designation" defaultValue={employee.designation || ""} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Employment Type</label>
          <select name="employment_type" defaultValue={employee.employment_type || "full_time"} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Account Status</label>
          <select name="status" defaultValue={employee.status || "active"} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all">
            <option value="active">Active</option>
            <option value="notice_period">Notice Period</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="md:col-span-2 pt-6 border-t border-slate-50">
           <p className="text-sm font-black uppercase tracking-widest text-slate-400">Payroll Baseline (Monthly)</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Base Salary</label>
          <input name="base_salary" type="number" defaultValue={employee.base_salary || 0} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">HRA</label>
            <input name="hra" type="number" defaultValue={employee.hra || 0} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Allowances</label>
            <input name="allowances" type="number" defaultValue={employee.allowances || 0} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
          </div>
        </div>
        
        <div className="md:col-span-2 flex gap-4 mt-10">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all hover:scale-[1.01]"
          >
            {loading ? "Saving Changes..." : "Update Employee Record"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl border border-slate-200 px-8 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
