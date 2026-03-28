"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CompanyUserRole } from "@/lib/db/types";

export type RoleContextValue = {
  role: CompanyUserRole;
  isAdmin: boolean;
  companyId: string;
  employeeId: string | null;
  firstName: string;
  employeeCode: string | null;
  firstLogin: boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({
  value,
  children,
}: {
  value: RoleContextValue;
  children: ReactNode;
}) {
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return ctx;
}
