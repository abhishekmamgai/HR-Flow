import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getEmployees } from "@/lib/hr-data";
import { EmployeeList } from "./employee-list";
import { DeleteEmployeeButton } from "./delete-employee-button";

type Props = { searchParams: Promise<{ search?: string }> };

export default async function EmployeesPage({ searchParams }: Props) {
  await requireAdmin();
  const { search } = await searchParams;
  const employees = await getEmployees(search);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-slate-800">Employees</h1>
          <p className="mt-1 text-slate-500 font-medium font-sans">Manage your workforce directory and access levels.</p>
        </div>
        <Link
          href="/employees/new"
          className="rounded-xl px-6 py-3 bg-blue-600 text-white font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] transition-all text-center"
        >
          + Add New Employee
        </Link>
      </header>

      <article className="surface-card border-none shadow-xl overflow-hidden">
        <header className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border)" }}>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Directory</p>
            <p className="mt-1 font-bold text-slate-700">
              {employees.length} Employee{employees.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Suspense fallback={<div className="h-11 w-48 rounded-lg bg-slate-50" />}>
            <EmployeeList search={search} />
          </Suspense>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-800 text-white/70">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Code</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Department</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Designation</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Credentials</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-slate-400 italic" colSpan={7}>
                    No employees matching your search criteria.
                  </td>
                </tr>
              ) : (
                employees.map((employee, i) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/employees/${employee.id}`} className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {employee.first_name} {employee.last_name}
                      </Link>
                      <p className="text-[10px] text-slate-400 font-medium font-sans">{employee.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-black tracking-tight">
                        {employee.employee_code ?? "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">{employee.department_name ?? "-"}</td>
                    <td className="px-6 py-4 text-slate-500">{employee.designation ?? "-"}</td>
                    <td className="px-6 py-4">
                      <span
                        className="status-chip text-[10px]"
                        style={
                          employee.status === "active"
                            ? { color: "var(--green)", background: "var(--green-bg)" }
                            : employee.status === "notice_period"
                              ? { color: "var(--orange)", background: "var(--orange-bg)" }
                              : { color: "var(--red)", background: "var(--red-bg)" }
                        }
                      >
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {employee.first_login ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 text-[10px] font-black rounded-full uppercase tracking-tight">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase tracking-tight">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <DeleteEmployeeButton
                        employeeId={employee.id}
                        employeeName={`${employee.first_name} ${employee.last_name}`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
