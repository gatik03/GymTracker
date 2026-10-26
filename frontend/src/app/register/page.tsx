"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Loader2 } from "lucide-react";

import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/apiErrors";
import { register } from "@/services/auth/authService";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "", password_confirm: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.password !== form.password_confirm) {
      setFieldErrors({ password_confirm: "Passwords do not match." });
      return;
    }
    setError("");
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await register(form);
      window.sessionStorage.setItem("gymtracker_pending_identifier", form.email.trim());
      router.push("/verify-email");
    } catch (submitError: unknown) {
      setFieldErrors(getApiFieldErrors(submitError));
      setError(getApiErrorMessage(submitError, "Your account could not be created."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-lg space-y-7">
        <header className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-zinc-950">
            <Dumbbell className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-white">Create your account</h1>
          <p className="mt-2 text-sm text-zinc-400">Start logging real training data in a few minutes.</p>
        </header>

        <section className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8">
          {error && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          <OAuthButtons destination="/" onError={setError} />

          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-zinc-600" aria-hidden="true">
            <span className="h-px flex-1 bg-zinc-800" />or use email<span className="h-px flex-1 bg-zinc-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Username
              <input
                autoComplete="username"
                required
                minLength={3}
                maxLength={150}
                aria-invalid={Boolean(fieldErrors.username)} aria-describedby={fieldErrors.username ? "register-username-error" : undefined} value={form.username}
                onChange={(event) => update("username", event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              {fieldErrors.username ? <span id="register-username-error" role="alert" className="block text-sm font-normal normal-case tracking-normal text-red-300">{fieldErrors.username}</span> : null}
            </label>
            <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Email
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "register-email-error" : undefined} value={form.email}
                onChange={(event) => update("email", event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              {fieldErrors.email ? <span id="register-email-error" role="alert" className="block text-sm font-normal normal-case tracking-normal text-red-300">{fieldErrors.email}</span> : null}
            </label>
            <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "register-password-error" : undefined} value={form.password}
                onChange={(event) => update("password", event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              {fieldErrors.password ? <span id="register-password-error" role="alert" className="block text-sm font-normal normal-case tracking-normal text-red-300">{fieldErrors.password}</span> : null}
            </label>
            <label className="block space-y-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                required
                aria-invalid={Boolean(fieldErrors.password_confirm)} aria-describedby={fieldErrors.password_confirm ? "register-password_confirm-error" : undefined} value={form.password_confirm}
                onChange={(event) => update("password_confirm", event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-base font-normal normal-case tracking-normal text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              {fieldErrors.password_confirm ? <span id="register-password_confirm-error" role="alert" className="block text-sm font-normal normal-case tracking-normal text-red-300">{fieldErrors.password_confirm}</span> : null}
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Creating account" /> : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-400">
            Already have an account? <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">Sign in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
