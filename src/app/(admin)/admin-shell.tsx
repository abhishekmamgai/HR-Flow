"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/lib/auth/role-context";

const ADMIN_NAV = [
  { href: "/dashboard", label: "📊 Dashboard" },
  { href: "/employees", label: "👥 Employees" },
  { href: "/attendance", label: "⏱ Attendance" },
  { href: "/leave/manage", label: "🏖 Leave Approvals" },
  { href: "/payroll", label: "💰 Payroll" },
  { href: "/settings", label: "⚙️ Settings" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { firstName, role } = useRole();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="surface-card border-l-0 border-t-0 border-b-0 rounded-none p-5 lg:sticky lg:top-0 lg:h-screen flex flex-col">
        <div className="border-b pb-4" style={{ borderColor: "var(--border)" }}>
          <p className="font-display text-2xl font-bold" style={{ color: "var(--blue)" }}>
            HRFlow
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--ink-4)" }}>
            Admin Portal
          </p>
        </div>

        <nav className="mt-6 space-y-2 text-sm flex-1">
          {ADMIN_NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2.5 transition-all ${
                  isActive 
                    ? "bg-[var(--blue-bg)] font-bold text-[var(--blue)] shadow-sm" 
                    : "text-[var(--ink-3)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Bottom */}
        <div className="mt-auto pt-6 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--ink-1)] flex items-center justify-center text-white font-bold">
              {firstName?.[0] || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate" style={{ color: "var(--ink-1)" }}>{firstName}</p>
              <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold tracking-wider uppercase rounded bg-[var(--blue-bg)] text-[var(--blue)]">
                {role?.toUpperCase() || "ADMIN"}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-[var(--red)] border border-transparent hover:bg-[var(--red-bg)] hover:border-[var(--red)]/20 transition-all"
          >
            Logout →
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-6 md:p-10 bg-[var(--background)]">
        {children}
      </main>
    </div>
  );
}
