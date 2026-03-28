"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GeneratePayrollButton() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function handleGenerate() {
    if (!confirm("Are you sure you want to generate the payroll for the current month? This will recalculate all active employee salaries and attendance.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payroll/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           month: new Date().getMonth() + 1, 
           year: new Date().getFullYear() 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate batch");

      showToast(`Successfully generated payroll for ${data.count} employees!`, "success");
      setTimeout(() => router.refresh(), 1500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Generation failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-2xl font-bold z-50 text-white transition-all transform ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} flex items-center gap-3`}>
          <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
        </div>
      )}
      <button 
        onClick={handleGenerate}
        disabled={loading}
        className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Generating..." : "Generate New Batch"}
      </button>
    </div>
  );
}
