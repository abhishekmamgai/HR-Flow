import { redirect } from "next/navigation";
import { getCompanyContext } from "@/lib/auth/company-context";

export async function requireAdmin() {
  const ctx = await getCompanyContext();
  if (!ctx.isAdmin) {
    redirect("/dashboard");
  }
  return ctx;
}

export async function requireEmployee() {
  const ctx = await getCompanyContext();
  if (ctx.employeeId === null) {
    redirect("/dashboard");
  }
  return ctx;
}
