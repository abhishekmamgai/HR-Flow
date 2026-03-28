"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  employee: {
    id: string;
    employee_code: string;
    first_login: boolean;
    employee_credentials?: {
      employee_code: string;
      temp_password: string;
      is_password_changed: boolean;
    }[];
  };
};

export function CredentialsSection({ employee }: Props) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const creds = Array.isArray(employee.employee_credentials) 
    ? employee.employee_credentials[0] 
    : employee.employee_credentials;

  async function handleResetPassword() {
    if (!confirm(`Reset password for ${employee.employee_code} to AskTech@123?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");

      setToast("Password reset successfully!");
      router.refresh();
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Login Credentials</h3>
        
        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-50">
            <span className="text-xs font-bold text-slate-400">ID:</span>
            <span className="text-sm font-black text-slate-800 tracking-tight">{employee.employee_code}</span>
          </div>
          
          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-50">
            <span className="text-xs font-bold text-slate-400">Pass:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-800 tracking-tight font-mono">
                {showPassword ? (creds?.temp_password || "AskTech@123") : "••••••••••"}
              </span>
              <button 
                onClick={() => setShowPassword(!showPassword)}
                className="text-blue-500 hover:text-blue-700 transition-colors"
                title="Toggle visibility"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
             <div className={`h-2 w-2 rounded-full ${employee.first_login ? "bg-orange-500 animate-pulse" : "bg-green-500"}`} />
             <span className="text-[10px] font-black uppercase tracking-tight text-slate-600">
               {employee.first_login ? "Status: ⚠️ First Login Pending" : "Status: ✅ Password Changed"}
             </span>
          </div>

          {toast && (
            <div className="px-1 text-[10px] font-bold text-green-600 animate-in fade-in">
              {toast}
            </div>
          )}

          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="mt-2 w-full py-3 text-xs font-black text-white bg-slate-800 rounded-xl hover:bg-slate-900 shadow-lg shadow-slate-100 transition-all disabled:opacity-50"
          >
            {loading ? "RESETTING..." : "RESET TO DEFAULT PASS"}
          </button>
        </div>
      </div>
    </div>
  );
}
