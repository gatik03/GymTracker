"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { PlateStackSurface } from "@/components/auth/PlateStackSurface";

type Destination = "/" | "/workouts" | "/analytics" | "/journal";
interface LoginCardProps { destination: Destination; visible: boolean; morphing: boolean; ready: boolean; error: string; notice: string; onError: (message: string) => void; stackSlotRef: RefObject<HTMLDivElement | null>; cssStack: boolean; }

export function LoginCard({ destination, visible, morphing, ready, error, notice, onError, stackSlotRef, cssStack }: LoginCardProps) {
  const { login, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const identifierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ready) window.requestAnimationFrame(() => identifierRef.current?.focus({ preventScroll: true }));
  }, [ready]);

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identifier.trim() || !password) { onError("Enter your username or email and password."); return; }
    onError("");
    try { await login(identifier.trim(), password, destination); }
    catch (loginError) { onError(getApiErrorMessage(loginError, "Unable to sign in with those credentials.")); }
  };

  return (
    <section aria-labelledby="signin-title" className="login-interface">
      <PlateStackSurface status={!visible ? "hidden" : morphing ? "morphing" : "ready"} stackSlotRef={stackSlotRef} cssStack={cssStack}>
        <header className="login-head">
          <p className="login-wordmark">STACKD<span>.</span></p>
          <h1 id="signin-title" className="login-title">Log in to your training log</h1>
        </header>

        {error ? <div role="alert" className="login-message login-message--error">{error}</div> : null}
        {notice ? <div role="status" className="login-message login-message--notice">{notice}</div> : null}

        <form className="login-form" onSubmit={submitLogin}>
          <fieldset disabled={!ready || isLoading} className="login-fieldset">
            <div className="login-field">
              <label htmlFor="identifier" className="login-label">Email or username</label>
              <input ref={identifierRef} id="identifier" autoComplete="username" type="text" required maxLength={254} value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="login-input" placeholder="you@example.com" />
            </div>
            <div className="login-field login-field--password">
              <label htmlFor="password" className="login-label">Password</label>
              <div className="login-input-wrap">
                <input id="password" autoComplete="current-password" type={showPassword ? "text" : "password"} required value={password} onChange={(event) => setPassword(event.target.value)} className="login-input login-input--password" />
                <button type="button" tabIndex={ready ? 0 : -1} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((isVisible) => !isVisible)} className="login-password-toggle">{showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button>
              </div>
              {/* After the input in the DOM so Tab goes field to field; placed on the label row visually. */}
              <Link href="/forgot-password" tabIndex={ready ? 0 : -1} className="login-forgot">Forgot password?</Link>
            </div>
            <button type="submit" disabled={!ready || isLoading || !identifier.trim() || !password} className="login-submit">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Logging in</> : "Log in"}</button>
          </fieldset>
        </form>

        <div className={!ready ? "login-alt pointer-events-none" : "login-alt"} role="group" aria-labelledby="login-alt-label">
          <p id="login-alt-label" className="login-alt__label">Or continue with</p>
          <OAuthButtons destination={destination} onError={onError} variant="plate" />
        </div>

        <p className="login-signup">New to STACKD? <Link href="/register" tabIndex={ready ? 0 : -1} className="login-link">Create an account</Link></p>
      </PlateStackSurface>
    </section>
  );
}
