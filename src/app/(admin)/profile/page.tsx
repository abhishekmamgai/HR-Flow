import { requireAdmin } from "@/lib/auth/require-admin";
import { getCompanyContext } from "@/lib/auth/company-context";

export default async function AdminProfilePage() {
  const ctx = await getCompanyContext();
  
  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <h1 className="font-display text-4xl font-bold text-slate-800">Administrator Profile</h1>
        <p className="mt-2 text-slate-500 font-medium">Manage your administrative credentials and system preferences.</p>
      </header>

      <article className="surface-card p-8 space-y-6">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Identity</h3>
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Login Email</p>
              <p className="font-bold text-slate-700">{ctx.isAdmin ? "admin@asktech.in" : "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Access Role</p>
              <p className="font-bold text-blue-600">SUPER ADMIN</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security</h3>
           <button className="mt-4 px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
             Change Admin Password
           </button>
        </div>
      </article>
    </div>
  );
}
