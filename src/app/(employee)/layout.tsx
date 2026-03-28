import { redirect } from "next/navigation";
import { getCompanyContext } from "@/lib/auth/company-context";
import { RoleProvider } from "@/lib/auth/role-context";
import EmployeeShell from "./employee-shell";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  let ctx;
  try {
    ctx = await getCompanyContext();
  } catch {
    redirect("/login");
  }

  // Force password change on first login
  if (ctx.firstLogin) {
    redirect("/change-password");
  }

  // If accidentally in employee group but is admin, redirect back
  // (In case middleware missed something)
  if (ctx.isAdmin && !ctx.employeeId) {
     redirect("/dashboard");
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
      <EmployeeShell>
        {children}
      </EmployeeShell>
    </RoleProvider>
  );
}
