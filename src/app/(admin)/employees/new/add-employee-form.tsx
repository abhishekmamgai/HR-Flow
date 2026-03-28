"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DepartmentRow } from "@/lib/db/types";

type Props = { departments: DepartmentRow[] };

export function AddEmployeeForm({ departments }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [showSuccess, setShowSuccess] = useState<null | { employee_code: string; temp_password: string; name: string }>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setToast("");
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    let profileUrl: string | null = null;
    const photo = fd.get("profile_photo") as File | null;
    if (photo?.size) {
      try {
        const upFd = new FormData();
        upFd.set("file", photo);
        const res = await fetch("/api/upload/profile", { method: "POST", body: upFd });
        const j = await res.json();
        if (j.data?.url) profileUrl = j.data.url;
      } catch {
        setError("Profile photo upload failed");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: fd.get("first_name"),
          last_name: fd.get("last_name"),
          email: fd.get("email"),
          phone: fd.get("phone") || undefined,
          department_id: fd.get("department_id") || null,
          designation: fd.get("designation") || undefined,
          employment_type: fd.get("employment_type") || "full_time",
          date_of_joining: fd.get("date_of_joining") || undefined,
          profile_photo_url: profileUrl,
          base_salary: fd.get("base_salary"),
          hra: fd.get("hra"),
          allowances: fd.get("allowances"),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add employee");

      setShowSuccess({
        employee_code: data.data.employee_code,
        temp_password: data.data.temp_password,
        name: `${data.data.first_name} ${data.data.last_name}`,
      });
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add employee");
    } finally {
      setLoading(false);
    }
  }

  if (showSuccess) {
    const credentialString = `Employee ID: ${showSuccess.employee_code} | Password: ${showSuccess.temp_password}`;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl animate-in zoom-in duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            ✅
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-slate-800" style={{ fontFamily: 'var(--font-fraunces)' }}>
            Employee Added Successfully!
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500 font-medium">
            Name: <span className="text-slate-800 font-bold">{showSuccess.name}</span>
          </p>

          <div className="mt-8 rounded-2xl bg-slate-50 p-6 border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Login Credentials</p>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500">ID:</span>
                <span className="text-sm font-black text-slate-800 tracking-tight">{showSuccess.employee_code}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500">Pass:</span>
                <span className="text-sm font-black text-slate-800 tracking-tight">{showSuccess.temp_password}</span>
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(credentialString);
                setToast("Copied to clipboard!");
                setTimeout(() => setToast(""), 2000);
              }}
              className="mt-4 w-full py-2.5 text-xs font-black text-blue-600 border border-blue-100 bg-blue-50/50 rounded-xl hover:bg-blue-50 transition-colors"
            >
              {toast === "Copied to clipboard!" ? "COPIED! ✓" : "COPY ID + PASSWORD"}
            </button>
          </div>

          <p className="mt-6 text-center text-[10px] font-bold text-orange-500 uppercase tracking-tight">
            ⚠️ Must change password on first login
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowSuccess(null)}
              className="py-3.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              ADD ANOTHER
            </button>
            <button
              onClick={() => router.push("/employees")}
              className="py-3.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              VIEW ALL
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card p-6">
      {error && (
        <div className="mb-4 rounded-lg p-3 text-sm" style={{ background: "var(--red-bg)", color: "var(--red)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
           <p className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>Personal Information</p>
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            First name *
          </label>
          <input name="first_name" required className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Last name *
          </label>
          <input name="last_name" required className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Email *
          </label>
          <input name="email" type="email" required className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Phone
          </label>
          <input name="phone" type="tel" className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} />
        </div>
        
        <div className="md:col-span-2 pt-4">
           <p className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>Employment Details</p>
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Department
          </label>
          <select name="department_id" className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }}>
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
          <input name="designation" className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} placeholder="e.g. Senior Developer" />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Employment type
          </label>
          <select name="employment_type" className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }}>
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Date of joining
          </label>
          <input name="date_of_joining" type="date" className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} />
        </div>

        <div className="md:col-span-2 pt-4">
           <p className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>Salary & Compensation (Monthly)</p>
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Base Salary (Basic)
          </label>
          <input name="base_salary" type="number" defaultValue="0" className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            HRA
          </label>
          <input name="hra" type="number" defaultValue="0" className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} />
        </div>
        <div>
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Allowances
          </label>
          <input name="allowances" type="number" defaultValue="0" className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} />
        </div>
        
        <div className="md:col-span-2 pt-4">
          <label className="block text-xs font-semibold" style={{ color: "var(--ink-3)" }}>
            Profile photo
          </label>
          <input name="profile_photo" type="file" accept="image/*" className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--border)", minHeight: 44 }} />
        </div>
        <div className="md:col-span-2 flex gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl px-8 py-3 text-sm font-bold text-white disabled:opacity-50 shadow-lg shadow-blue-100 transition-all hover:scale-[1.02]"
            style={{ background: "var(--blue)", minHeight: 48 }}
          >
            {loading ? "Processing..." : "Create Employee →"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/employees")}
            className="rounded-xl border px-8 py-3 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-50"
            style={{ borderColor: "var(--border)", minHeight: 48 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
