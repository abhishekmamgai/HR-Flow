import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CompanyUserRow } from "@/lib/db/types";

const ADMIN_ROLES = ["super_admin", "company_admin", "hr_manager"] as const;

export type CompanyContext = {
  userId: string;
  companyId: string;
  role: CompanyUserRow["role"];
  employeeId: string | null;
  isAdmin: boolean;
  firstName: string;
  employeeCode: string | null;
  firstLogin: boolean;
};

export const getCompanyContext = cache(async (): Promise<CompanyContext> => {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to access this data.");
  }

  const { data: companyUser, error: companyUserError } = await supabase
    .from("company_users")
    .select("company_id, user_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single<CompanyUserRow>();

  if (companyUserError || !companyUser) {
    throw new Error("No company mapping found for current user.");
  }

  const isAdmin = (ADMIN_ROLES as readonly string[]).includes(companyUser.role);

  let employeeId: string | null = null;
  let firstName = "User";
  let employeeCode: string | null = null;
  let firstLogin = false;

  const { data: emp } = await supabase
    .from("employees")
    .select("id, first_name, employee_code, first_login")
    .eq("company_id", companyUser.company_id)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (emp) {
    employeeId = emp.id;
    firstName = emp.first_name;
    employeeCode = emp.employee_code ?? null;
    firstLogin = emp.first_login ?? false;
  } else if (isAdmin) {
    // If it's an admin with no employee record, use their email prefix
    firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || "Admin";
  }

  // Self-heal: Sync role to Auth Metadata if missing or mismatch
  // This prevents middleware redirect loops
  if (user.user_metadata?.role !== companyUser.role || 
      user.user_metadata?.first_login !== firstLogin) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: { 
        ...user.user_metadata,
        role: companyUser.role,
        first_login: firstLogin
      }
    });
  }

  return {
    userId: user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    employeeId,
    isAdmin,
    firstName,
    employeeCode,
    firstLogin,
  };
});
