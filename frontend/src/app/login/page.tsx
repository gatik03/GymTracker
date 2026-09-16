"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { PlateIntro } from "@/components/auth/PlateIntro";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/apiErrors";

type Destination = "/" | "/workouts" | "/analytics" | "/journal";

const destinations: Array<{ value: Destination; label: string }> = [
  { value: "/", label: "Dashboard" },
  { value: "/workouts", label: "Workout Logger" },
  { value: "/analytics", label: "Progress" },
  { value: "/journal", label: "Journal" },
];

const oauthErrors: Record<string, string> = {
  invalid_state: "The sign-in attempt expired or could not be verified. Please try again.",
  cancelled: "Provider sign-in was cancelled.",
  account_exists: "An account already uses that email. Sign in with your password, then connect the provider from Profile.",
  oauth_failed: "The provider could not complete sign-in. Please try again.",
  invalid_callback: "The provider returned an incomplete sign-in response.",
  unsupported_provider: "That sign-in provider is not available.",
};

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [destination, setDestination] = useState<Destination>("/");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { login, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem("gymtracker_destination");
      if (destinations.some((item) => item.value === saved)) setDestination(saved as Destination);
      const search = new URLSearchParams(window.location.search);
      const requested = search.get("next");
      if (destinations.some((item) => item.value === requested)) setDestination(requested as Destination);
      const oauthError = search.get("oauth_error");
      if (oauthError) setError(oauthErrors[oauthError] ?? "Sign-in could not be completed.");
      if (search.get("session") === "expired") setError("Your session expired. Please sign in again.");
      if (search.get("reset") === "complete") setNotice("Password reset complete. You can sign in now.");
      if (search.size > 0) window.history.replaceState({}, "", "/login");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(destination);
  }, [destination, isAuthenticated, isLoading, router]);

  const chooseDestination = (value: Destination) => {
    setDestination(value);
    window.localStorage.setItem("gymtracker_destination", value);
  };

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Enter your username or email and password.");
      return;
    }
    setError("");
    setNotice("");
    try {
      await login(identifier.trim(), password, destination);
    } catch (loginError) {
      setError(getApiErrorMessage(loginError, "Unable to sign in with those credentials."));
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto grid w-full max-w-6xl items-start gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
        <PlateIntro />

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/55 p-5 shadow-2xl sm:p-8 lg:sticky lg:top-8" aria-labelledby="signin-title">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">Secure access</p>
            <h2 id="signin-title" className="mt-2 text-3xl font-bold tracking-tight text-zinc-50">Welcome back</h2>
            <p className="mt-2 text-sm text-zinc-500">Sign in and continue exactly where you want to go.</p>
          </header>

          <div className="mt-6 space-y-5">
            {error ? <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}
            {notice ? <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</div> : null}

            <OAuthButtons destination={destination} onError={setError} />

            <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-zinc-600" aria-hidden="true"><span className="h-px flex-1 bg-zinc-800" />or<span className="h-px flex-1 bg-zinc-800" /></div>

            <form className="space-y-4" onSubmit={submitLogin}>
              <div className="space-y-1.5">
                <label htmlFor="identifier" className="text-sm font-medium text-zinc-300">Username or email</label>
                <input id="identifier" autoComplete="username" type="text" required maxLength={254} value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="min-h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-100 outline-none transition focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3"><label htmlFor="password" className="text-sm font-medium text-zinc-300">Password</label><Link href="/forgot-password" className="text-xs font-medium text-emerald-400 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50">Forgot password?</Link></div>
                <div className="relative">
                  <input id="password" autoComplete="current-password" type={showPassword ? "text" : "password"} required value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 pl-4 pr-12 text-zinc-100 outline-none transition focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20" />
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="destination" className="text-sm font-medium text-zinc-300">Continue to</label>
                <select id="destination" value={destination} onChange={(event) => chooseDestination(event.target.value as Destination)} className="min-h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-100 outline-none focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20">
                  {destinations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>

              <button type="submit" disabled={isLoading || !identifier.trim() || !password} className="flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
              </button>
            </form>

            <p className="text-center text-sm text-zinc-500">New to GymTracker? <Link href="/register" className="font-semibold text-emerald-400 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50">Create an account</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
