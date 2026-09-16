"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, Loader2, Mail } from "lucide-react";

import { getApiErrorMessage } from "@/lib/apiErrors";
import {
  confirmEmailVerification,
  requestEmailVerification,
} from "@/services/auth/authService";

export default function VerifyEmailPage() {
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { completeAuthentication } = useAuth();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIdentifier(window.sessionStorage.getItem("gymtracker_pending_identifier") ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const user = await confirmEmailVerification(identifier.trim(), code.trim());
      window.sessionStorage.removeItem("gymtracker_pending_identifier");
      completeAuthentication(user);
    } catch (verifyError: unknown) {
      setError(getApiErrorMessage(verifyError, "The code could not be verified."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend = async () => {
    if (!identifier.trim()) {
      setError("Enter the username or email for the account.");
      return;
    }
    setError("");
    setMessage("");
    setIsResending(true);
    try {
      setMessage(await requestEmailVerification(identifier.trim()));
    } catch (resendError: unknown) {
      setError(getApiErrorMessage(resendError, "A new code could not be requested."));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <section className="w-full max-w-md space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
        <header className="text-center">
          <Mail className="mx-auto h-8 w-8 text-emerald-400" aria-hidden="true" />
          <h1 className="mt-3 text-2xl font-extrabold text-white">Verify your email</h1>
          <p className="mt-2 text-sm text-zinc-400">Enter the six-digit code from your email. It expires after 24 hours and works once.</p>
        </header>

        {error && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        {message && <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}

        <form onSubmit={verify} className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Username or email
            <input
              required
              maxLength={254}
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Verification code
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-center text-xl font-semibold tracking-[0.35em] text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Verifying email" /> : <><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Verify email</>}
          </button>
        </form>

        <button
          type="button"
          disabled={isResending}
          onClick={() => void resend()}
          className="min-h-11 w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          {isResending ? "Sending…" : "Send a new code"}
        </button>
        <p className="text-center text-sm text-zinc-500"><Link href="/login" className="text-emerald-400 hover:text-emerald-300">Back to sign in</Link></p>
      </section>
    </main>
  );
}
