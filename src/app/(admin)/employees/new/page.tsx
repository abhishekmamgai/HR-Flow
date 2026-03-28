import { getDepartments } from "@/lib/hr-data";
import { AddEmployeeForm } from "./add-employee-form";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function NewEmployeePage() {
  await requireAdmin();
  const departments = await getDepartments();

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <h1 className="font-display text-4xl font-bold text-slate-800">Add New Employee</h1>
        <p className="mt-2 text-slate-500 font-medium">Create a new record and auto-generate login credentials.</p>
      </header>

      <div className="surface-card p-1">
        <AddEmployeeForm departments={departments} />
      </div>
    </div>
  );
}
