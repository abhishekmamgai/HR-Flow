import { notFound } from "next/navigation";
import { getEmployeeById, getDepartments } from "@/lib/hr-data";
import { EditEmployeeForm } from "./edit-employee-form";
import { requireAdmin } from "@/lib/auth/require-admin";

type Props = { params: Promise<{ id: string }> };

export default async function EditEmployeePage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  
  const [employee, departments] = await Promise.all([
    getEmployeeById(id).catch(() => null),
    getDepartments()
  ]);

  if (!employee) notFound();

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <h1 className="font-display text-4xl font-bold text-slate-800">Edit Employee</h1>
        <p className="mt-2 text-slate-500 font-medium">Update profile, department, or status for this record.</p>
      </header>

      <div className="surface-card p-1">
        <EditEmployeeForm employee={employee} departments={departments} />
      </div>
    </div>
  );
}
