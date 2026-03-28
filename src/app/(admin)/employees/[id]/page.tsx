import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getEmployeeById } from "@/lib/hr-data";
import { FaceSection } from "./face-section";
import { CredentialsSection } from "./credentials-section";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export default async function EmployeeProfilePage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  let employee;
  try {
    employee = await getEmployeeById(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
         <div>
            <h1 className="font-display text-4xl font-black text-slate-800">{employee.first_name} {employee.last_name}</h1>
            <p className="text-slate-500 font-medium">Employee Profile & Security Settings</p>
         </div>
         <Link href="/employees" className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">← Back to Directory</Link>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
           <article className="surface-card p-8 border-none shadow-xl">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Personal Details</h2>
              <dl className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">{employee.first_name} {employee.last_name}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee Code</dt>
                  <dd className="mt-1">
                     <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-black">{employee.employee_code}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">{employee.email}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">{employee.department_name ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Designation</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">{employee.designation ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Status</dt>
                  <dd className="mt-1">
                     <span className="status-chip text-[10px]" style={
                       employee.status === 'active' ? { background: "var(--green-bg)", color: "var(--green)" } : { background: "var(--orange-bg)", color: "var(--orange)" }
                     }>{employee.status}</span>
                  </dd>
                </div>
              </dl>
           </article>
           
           <article className="surface-card p-0 border-none shadow-xl overflow-hidden mt-8">
              <div className="p-8 border-b border-slate-100">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Biometric Registration</h2>
                <FaceSection employee={employee} />
              </div>
           </article>
        </div>

        <aside className="space-y-8">
           <article className="surface-card p-0 border-none shadow-xl overflow-hidden">
              <div className="p-8">
                 <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Access Control</h2>
                 <CredentialsSection employee={employee} />
              </div>
           </article>

           <div className="flex flex-col gap-3">
              <Link
                href={`/employees/${employee.id}/edit`}
                className="w-full rounded-2xl bg-slate-800 py-4 text-center text-sm font-black text-white shadow-xl hover:bg-slate-900 transition-all"
              >
                Edit Complete Details
              </Link>
           </div>
        </aside>
      </div>
    </div>
  );
}
