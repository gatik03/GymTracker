"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void error.digest;
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold uppercase tracking-widest text-red-400">Something went wrong</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white">We could not load this page</h1>
        <p className="mt-3 text-zinc-400">Try the request again. If the problem continues, return to the dashboard.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-zinc-950 hover:bg-emerald-400">
            Try again
          </button>
          <Link href="/" className="min-h-11 rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-100 hover:bg-zinc-900">
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
