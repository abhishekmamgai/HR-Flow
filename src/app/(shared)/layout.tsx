import { getCompanyContext } from "@/lib/auth/company-context";
import { RoleProvider } from "@/lib/auth/role-context";
import { redirect } from "next/navigation";

export default async function SharedLayout({ children }: { children: React.ReactNode }) {
  let ctx;
  try {
    ctx = await getCompanyContext();
  } catch {
    redirect("/login");
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
      {children}
    </RoleProvider>
  );
}
