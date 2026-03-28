"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Props = { search?: string };

export function EmployeeList({ search }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (v) params.set("search", v);
    else params.delete("search");
    startTransition(() => {
      router.push(`/employees${params.toString() ? `?${params}` : ""}`);
    });
  }

  return (
    <input
      type="search"
      placeholder="Search by name or email…"
      defaultValue={search}
      onChange={handleSearch}
      className="rounded-lg border px-3 py-2 text-sm"
      style={{ borderColor: "var(--border)", minHeight: 44, minWidth: 180 }}
    />
  );
}
