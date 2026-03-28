import { requireAdmin } from "@/lib/auth/require-admin";
import { getPendingLeaves } from "@/lib/hr-data";
import Link from "next/link";
import { LeaveApprovalCards } from "./leave-approval-cards";

export default async function ManageLeavePage() {
  await requireAdmin();
  const pendingLeaves = await getPendingLeaves();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl font-bold text-slate-800">Leave Approvals</h1>
        <p className="mt-2 text-slate-500 font-medium">Review and respond to employee time-off requests.</p>
      </header>

      <article className="surface-card border-none shadow-xl overflow-hidden">
        <header className="px-8 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Queue</p>
              <p className="font-bold text-slate-700 mt-1">{pendingLeaves.length} Requests waiting</p>
           </div>
        </header>

          <div className="p-8">
            <LeaveApprovalCards leaves={pendingLeaves} />
          </div>
        </article>
    </div>
  );
}
