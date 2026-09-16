import Link from "next/link";
import { Dumbbell } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-center">
      <div className="max-w-md">
        <Dumbbell className="mx-auto h-9 w-9 text-emerald-400" aria-hidden="true" />
        <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-emerald-400">404</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white">That page is not here</h1>
        <p className="mt-3 text-zinc-400">The link may be outdated, or the page may have moved.</p>
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-emerald-500 px-5 py-3 font-bold text-zinc-950 hover:bg-emerald-400">
          Return to Dashboard
        </Link>
      </div>
    </main>
  );
}
