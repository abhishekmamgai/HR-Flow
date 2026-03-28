import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-6">
        🔍
      </div>
      <h1 className="font-display text-4xl font-black text-slate-800 tracking-tight">Employee Not Found</h1>
      <p className="mt-4 text-slate-500 font-medium max-w-sm">
        The record you are looking for does not exist or may have been moved to a different department.
      </p>
      <Link 
        href="/employees" 
        className="mt-8 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all hover:scale-[1.02]"
      >
        ← Return to Directory
      </Link>
    </div>
  );
}
