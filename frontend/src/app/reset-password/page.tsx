"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole } from "lucide-react";

import { getApiErrorMessage } from "@/lib/apiErrors";
import { confirmPasswordReset } from "@/services/auth/authService";

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ identifier: "", code: "", password: "", password_confirm: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const identifier = window.sessionStorage.getItem("gymtracker_reset_identifier") ?? "";
      setForm((current) => ({ ...current, identifier }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.password !== form.password_confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(form);
      window.sessionStorage.removeItem("gymtracker_reset_identifier");
      router.push("/login?reset=complete");
    } catch (submitError: unknown) {
      setError(getApiErrorMessage(submitError, "The password could not be reset."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <section className="w-full max-w-md space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
        <header className="text-center">
          <LockKeyhole className="mx-auto h-8 w-8 text-emerald-400" aria-hidden="true" />
          <h1 className="mt-3 text-2xl font-extrabold text-white">Choose a new password</h1>
          <p className="mt-2 text-sm text-zinc-400">Use the six-digit code from your email. Resetting your password revokes existing sessions.</p>
        </header>
        {error && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Username or email
            <input required autoComplete="username" maxLength={254} value={form.identifier} onChange={(event) => update("identifier", event.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-emerald-500" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Reset code
            <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={form.code} onChange={(event) => update("code", event.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-center text-xl font-semibold tracking-[0.35em] text-white outline-none focus:border-emerald-500" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            New password
            <input required type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={(event) => update("password", event.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-emerald-500" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Confirm new password
            <input required type="password" autoComplete="new-password" value={form.password_confirm} onChange={(event) => update("password_confirm", event.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-emerald-500" />
          </label>
          <button type="submit" disabled={isSubmitting || form.code.length !== 6} className="flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Resetting password" /> : "Reset password"}
          </button>
        </form>
        <p className="text-center text-sm"><Link href="/forgot-password" className="text-emerald-400 hover:text-emerald-300">Request another code</Link></p>
      </section>
    </main>
  );
}
