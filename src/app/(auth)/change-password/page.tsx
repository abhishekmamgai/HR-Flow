"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(0);
  const [name, setName] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setName(user.user_metadata?.name || "Employee");
      }
    }
    getUser();
  }, [supabase]);

  function calculateStrength(p: string) {
    let s = 0;
    if (p.length >= 8) s += 25;
    if (/[A-Z]/.test(p)) s += 25;
    if (/[0-9]/.test(p)) s += 25;
    if (/[^A-Za-z0-9]/.test(p)) s += 25;
    setStrength(s);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (strength < 75) {
      setError("Password is too weak. Please use symbols and capitals.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      // Refresh the local session so that the middleware sees first_login = false immediately
      await supabase.auth.refreshSession();

      router.push("/employee/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white p-10 shadow-xl">
        <header className="text-center mb-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 text-3xl mb-6 shadow-lg shadow-purple-200">
            🔐
          </div>
          <h1 className="font-display text-3xl font-black text-slate-800">
            Set Your Password
          </h1>
          <p className="mt-3 text-sm font-medium text-slate-500">
            Welcome {name}! Create a secure password to continue to your dashboard.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                calculateStrength(e.target.value);
              }}
              required
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm focus:border-purple-500 focus:bg-white focus:outline-none transition-all"
              placeholder="Min. 8 characters"
            />
            {/* Strength Bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
               <div 
                  className={`h-full transition-all duration-500 ${
                     strength <= 25 ? 'bg-red-500' : 
                     strength <= 50 ? 'bg-orange-500' : 
                     strength <= 75 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${strength}%` }}
               />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-sm focus:border-purple-500 focus:bg-white focus:outline-none transition-all"
              placeholder="Repeat password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-bold text-red-600">⚠️ {error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-purple-600 py-4.5 text-sm font-black text-white shadow-xl shadow-purple-100 transition-all hover:bg-purple-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Updating..." : "Set Password & Continue →"}
          </button>
        </form>
      </div>
    </div>
  );
}
