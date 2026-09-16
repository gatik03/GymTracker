import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-center">
      <div className="max-w-md">
        <ShieldX className="mx-auto h-9 w-9 text-amber-400" aria-hidden="true" />
        <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-amber-400">Access denied</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white">You cannot open this resource</h1>
        <p className="mt-3 text-zinc-400">Sign in with the correct account or return to your dashboard.</p>
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-emerald-500 px-5 py-3 font-bold text-zinc-950">
          Return to Dashboard
        </Link>
      </div>
    </main>
  );
}
