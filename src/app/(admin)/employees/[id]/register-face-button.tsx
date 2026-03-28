"use client";

import { useRouter } from "next/navigation";

type Props = { employeeId: string };

export function RegisterFaceButton({ employeeId }: Props) {
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push(`/face-id?register=${employeeId}`)}
        className="w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "var(--purple)", minHeight: 44 }}
      >
        Register Face
      </button>
    </div>
  );
}
