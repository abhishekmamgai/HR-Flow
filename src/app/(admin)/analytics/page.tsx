import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AnalyticsPage() {
  await requireAdmin();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl font-bold text-slate-800">Analytics</h1>
        <p className="mt-2 text-slate-500 font-medium">Headcount, attendance and payroll insights.</p>
      </header>
      
      <article className="surface-card p-8 bg-slate-50 border-dashed border-2 text-center py-24">
        <div className="max-w-xs mx-auto">
          <p className="text-4xl mb-4">📊</p>
          <p className="font-bold text-slate-700 underline decoration-blue-500 decoration-4 underline-offset-4">Advanced Analytics Engine</p>
          <p className="mt-4 text-xs text-slate-500 leading-relaxed font-medium">
            Next-gen trend charts, department-wise KPI drilldowns, and automated exportable reports are being generated from your workforce data.
          </p>
        </div>
      </article>
    </div>
  );
}
