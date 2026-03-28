"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6">
      <div className="surface-card p-5">
        <p>Dashboard load failed.</p>
        <button onClick={reset} className="mt-3 rounded-lg px-4 py-2 text-white" style={{ background: "var(--blue)", minHeight: 44 }}>
          Retry
        </button>
      </div>
    </div>
  );
}
