"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState<"admin" | "employee">("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (loginType === "admin") {
        const supabase = createClient();
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.push("/dashboard");
      } else {
        const res = await fetch("/api/auth/employee-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employee_code: employeeCode, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        router.push(data.redirect);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:py-10"
      style={{ background: "var(--background)" }}
    >

      {/* Login Card */}
      <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 sm:p-10 shadow-2xl shadow-blue-100/50">
        <header className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white shadow-lg shadow-blue-200 mb-6 font-display">
            HF
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-800">Welcome back</h1>
          <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            ASK TECH • HRMS PORTAL
          </p>
        </header>

        {/* Tabs */}
        <div className="mt-8 sm:mt-10 flex rounded-2xl bg-slate-50 p-1.5 border border-slate-100">
          <button
            onClick={() => { setLoginType("admin"); setError(""); setEmail(""); setPassword(""); }}
            className={`flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-tight transition-all ${
              loginType === "admin"
                ? "bg-white text-blue-600 shadow-sm border border-slate-100"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Admin / HR
          </button>
          <button
            onClick={() => { setLoginType("employee"); setError(""); setEmployeeCode(""); setPassword(""); }}
            className={`flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-tight transition-all ${
              loginType === "employee"
                ? "bg-white text-blue-600 shadow-sm border border-slate-100"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Employee
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {loginType === "admin" ? (
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                placeholder="Enter your email"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none transition-all font-bold tracking-tight"
                placeholder="Enter your Employee ID"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 animate-in fade-in slide-in-from-top-1">
              <p className="text-[11px] font-bold text-red-600 tracking-tight leading-tight">
                ⚠️ {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-blue-600 py-4 text-sm font-black text-white shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            style={{ minHeight: 54 }}
          >
            {loading ? "Verifying..." : "Login →"}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">
          Secure Access Protocol • v2.2
        </p>
      </div>

    </div>
  );
}
