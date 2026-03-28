"use client";

import { useRole } from "@/lib/auth/role-context";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EmployeeProfilePage() {
  const { employeeId } = useRole();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      if (!employeeId) return;
      const { data } = await supabase
        .from("employees")
        .select("*, departments(name)")
        .eq("id", employeeId)
        .single();
      
      setEmployee(data);
      setLoading(false);
    }
    fetchProfile();
  }, [employeeId, supabase]);

  if (loading) return <div className="animate-pulse h-64 bg-[var(--surface-2)] rounded-2xl" />;

  return (
    <div className="max-w-2xl space-y-10">
      <header>
        <h1 className="text-3xl font-bold" style={{ color: "var(--ink-1)" }}>My Profile</h1>
        <p className="text-[var(--ink-4)]">Your personal and professional details</p>
      </header>

      <section className="surface-card p-8">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: "var(--ink-4)" }}>Personal Details</h3>
        
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: "var(--ink-4)" }}>First Name</dt>
            <dd className="mt-1 font-bold text-lg">{employee?.first_name}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: "var(--ink-4)" }}>Last Name</dt>
            <dd className="mt-1 font-bold text-lg">{employee?.last_name}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: "var(--ink-4)" }}>Email Address</dt>
            <dd className="mt-1 font-medium">{employee?.email}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: "var(--ink-4)" }}>Department</dt>
            <dd className="mt-1 font-bold">{employee?.departments?.name || "-"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: "var(--ink-4)" }}>Designation</dt>
            <dd className="mt-1 font-bold">{employee?.designation || "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="surface-card p-8 bg-[var(--surface-2)] border-none">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--ink-4)" }}>Security & Authentication</h3>
        
        <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border" style={{ borderColor: "var(--border)" }}>
          <div>
            <p className="font-bold">Face Recognition</p>
            <p className="text-xs mt-1" style={{ color: "var(--ink-4)" }}>Used for secure attendance marking</p>
          </div>
          <div className="text-right">
             {employee?.face_embedding ? (
               <span className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "var(--green-bg)", color: "var(--green)" }}>
                 Face Active ✓
               </span>
             ) : (
               <span className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "var(--surface-2)", color: "var(--ink-4)" }}>
                 Not Registered
               </span>
             )}
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-dashed" style={{ borderColor: "var(--border)" }}>
          <span className="text-xl">ℹ️</span>
          <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--ink-4)" }}>
            Employee biometric data can only be registered or updated by an administrator. 
            <br />
            <span className="font-bold text-[var(--blue)]">Contact HR if you need to register or update your face data.</span>
          </p>
        </div>
      </section>

      <p className="text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--ink-4)" }}>
        ASK TECH • HR FLOW v2.0
      </p>
    </div>
  );
}
