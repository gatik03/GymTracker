"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Apple, ArrowRight, Eye, EyeOff, Loader2, Mail } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/apiErrors";

type Destination = "/" | "/workouts" | "/analytics" | "/journal";
interface LoginCardProps { destination: Destination; visible: boolean; morphing: boolean; ready: boolean; error: string; notice: string; onError: (message: string) => void; }

export function LoginCard({ destination, visible, morphing, ready, error, notice, onError }: LoginCardProps) {
  const { login, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [socialNotice, setSocialNotice] = useState("");
  const identifierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ready) window.requestAnimationFrame(() => identifierRef.current?.focus());
  }, [ready]);

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identifier.trim() || !password) { onError("Enter your username or email and password."); return; }
    onError("");
    setSocialNotice("");
    try { await login(identifier.trim(), password, destination); }
    catch (loginError) { onError(getApiErrorMessage(loginError, "Unable to sign in with those credentials.")); }
  };
  const showIntegrationNotice = (provider: string) => { setSocialNotice(provider + " sign-in will connect here next."); onError(""); };

  return (
    <section aria-labelledby="signin-title" className={"relative mx-auto w-full max-w-md rounded-[1.65rem] border border-white/[0.1] bg-[#111116] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.4)] transition-[opacity,transform,filter,border-radius] duration-700 motion-reduce:transition-none sm:p-8 " + (visible ? (ready ? "opacity-100" : "pointer-events-none opacity-100") : "pointer-events-none opacity-0") + (ready ? " translate-y-0 scale-100 blur-0" : morphing ? " translate-y-0 scale-[0.78] rounded-[2.25rem] blur-0" : " translate-y-5 scale-90 blur-sm")}>
      <div className="absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-orange-400/80 to-transparent" />
      <div className={"transition-opacity duration-300 " + (ready ? "opacity-100 delay-200" : "opacity-0")}>
      <div className="mb-7 flex items-start justify-between gap-4"><div><p className="font-heading text-3xl uppercase tracking-[0.1em] text-zinc-100">Stackd<span className="text-orange-400">.</span></p><p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-400">Welcome back</p><h2 id="signin-title" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">Log in to continue training</h2></div><div className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-orange-400 sm:flex" aria-hidden="true"><span className="h-4 w-4 rounded-full border-2 border-current" /></div></div>
      {error ? <div role="alert" className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm leading-5 text-red-300">{error}</div> : null}
      {notice ? <div role="status" className="mb-4 rounded-xl border border-orange-400/20 bg-orange-400/10 p-3 text-sm leading-5 text-orange-200">{notice}</div> : null}
      {socialNotice ? <div role="status" className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-5 text-zinc-400">{socialNotice}</div> : null}

      <form className="space-y-5" onSubmit={submitLogin}>
        <fieldset disabled={!ready || isLoading} className="space-y-5">
          <div className="space-y-2"><label htmlFor="identifier" className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Email or username</label><input ref={identifierRef} id="identifier" autoComplete="username" type="text" required maxLength={254} value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="min-h-12 w-full rounded-xl border border-white/10 bg-[#09090c] px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 hover:border-white/20 focus-visible:border-orange-400 focus-visible:ring-4 focus-visible:ring-orange-400/10" placeholder="you@example.com" /></div>
          <div className="space-y-2"><div className="flex items-center justify-between gap-3"><label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Password</label><Link href="/forgot-password" tabIndex={ready ? 0 : -1} className="text-xs font-medium text-orange-400 transition hover:text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">Forgot password?</Link></div><div className="relative"><input id="password" autoComplete="current-password" type={showPassword ? "text" : "password"} required value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-white/10 bg-[#09090c] py-2 pl-4 pr-12 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 hover:border-white/20 focus-visible:border-orange-400 focus-visible:ring-4 focus-visible:ring-orange-400/10" placeholder="••••••••" /><button type="button" tabIndex={ready ? 0 : -1} aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
          <div className="flex items-center justify-between gap-3"><label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-500"><input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-[#09090c] accent-orange-400 focus-visible:ring-2 focus-visible:ring-orange-400" />Remember me</label></div>
          <button type="submit" disabled={!ready || isLoading || !identifier.trim() || !password} className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-400 px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[#1b0d08] transition hover:bg-orange-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-400/25 disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Logging in…</> : <>Log in <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}</button>
        </fieldset>
      </form>

      <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600" aria-hidden="true"><span className="h-px flex-1 bg-white/[0.08]" />or continue with<span className="h-px flex-1 bg-white/[0.08]" /></div>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" disabled={!ready} onClick={() => { identifierRef.current?.focus(); setSocialNotice("Email sign-in is ready above."); }} className="flex aspect-square min-h-0 flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.025] px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400 transition hover:-translate-y-0.5 hover:border-orange-400/50 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:pointer-events-none disabled:opacity-40"><Mail className="h-4 w-4" />Email</button>
        <button type="button" disabled={!ready} onClick={() => showIntegrationNotice("Google")} className="flex aspect-square min-h-0 flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.025] px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400 transition hover:-translate-y-0.5 hover:border-orange-400/50 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:pointer-events-none disabled:opacity-40"><span className="text-base font-bold">G</span>Google</button>
        <button type="button" disabled={!ready} onClick={() => showIntegrationNotice("Apple")} className="flex aspect-square min-h-0 flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.025] px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400 transition hover:-translate-y-0.5 hover:border-orange-400/50 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:pointer-events-none disabled:opacity-40"><Apple className="h-4 w-4" />Apple</button>
      </div>
      <p className="mt-7 text-center text-sm text-zinc-500">Don&apos;t have an account? <Link href="/register" tabIndex={ready ? 0 : -1} className="font-semibold text-orange-400 transition hover:text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">Sign up</Link></p>
      </div>
    </section>
  );
}
