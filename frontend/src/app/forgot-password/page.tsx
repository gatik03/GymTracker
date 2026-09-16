"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldQuestion } from "lucide-react";

import { getApiErrorMessage } from "@/lib/apiErrors";
import { requestPasswordReset } from "@/services/auth/authService";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await requestPasswordReset(identifier.trim());
      window.sessionStorage.setItem("gymtracker_reset_identifier", identifier.trim());
      router.push("/reset-password");
    } catch (submitError: unknown) {
      setError(getApiErrorMessage(submitError, "The reset request could not be completed."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <section className="w-full max-w-md space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
        <header className="text-center">
          <ShieldQuestion className="mx-auto h-8 w-8 text-emerald-400" aria-hidden="true" />
          <h1 className="mt-3 text-2xl font-extrabold text-white">Reset your password</h1>
          <p className="mt-2 text-sm text-zinc-400">We will send a short-lived, single-use code if the account is eligible.</p>
        </header>
        {error && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Username or email
            <input
              required
              autoComplete="username"
              maxLength={254}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Requesting code" /> : "Send reset code"}
          </button>
        </form>
        <p className="text-center text-sm"><Link href="/login" className="text-emerald-400 hover:text-emerald-300">Back to sign in</Link></p>
      </section>
    </main>
  );
}
