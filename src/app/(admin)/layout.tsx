import { getCompanyContext } from "@/lib/auth/company-context";
import { RoleProvider } from "@/lib/auth/role-context";
import { redirect } from "next/navigation";
import AdminShell from "./admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let ctx;
  try {
    ctx = await getCompanyContext();
  } catch {
    redirect("/login");
  }

  // Double check admin role
  if (!ctx.isAdmin && ctx.role !== 'hr_manager') {
    redirect("/employee/dashboard");
  }

  // If first login, force change password
  if (ctx.firstLogin) {
    redirect("/change-password");
  }

  return (
    <RoleProvider
      value={{
        role: ctx.role,
        isAdmin: ctx.isAdmin,
        companyId: ctx.companyId,
        employeeId: ctx.employeeId,
        firstName: ctx.firstName,
        employeeCode: ctx.employeeCode,
        firstLogin: ctx.firstLogin,
      }}
    >
      <AdminShell>{children}</AdminShell>
    </RoleProvider>
  );
}
