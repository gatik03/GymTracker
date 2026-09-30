"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { LoginCard } from "@/components/auth/LoginCard";
import { useAuth } from "@/context/AuthContext";

const LoginIntro3D = dynamic(
  () => import("@/components/auth/LoginIntro3D/LoginIntro3D").then((module) => module.LoginIntro3D),
  { ssr: false },
);

type Destination = "/" | "/workouts" | "/analytics" | "/journal";
const destinations: Destination[] = ["/", "/workouts", "/analytics", "/journal"];

const oauthErrors: Record<string, string> = {
  invalid_state: "The sign-in attempt expired or could not be verified. Please try again.",
  provider_denied: "Sign-in was cancelled.",
  provider_unavailable: "That sign-in provider is currently unavailable.",
  callback_failed: "The sign-in provider could not verify your account.",
};

export default function LoginPage() {
  const [destination, setDestination] = useState<Destination>("/");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [introReady, setIntroReady] = useState(false);
  const [morphing, setMorphing] = useState(false);
  const [cssStack, setCssStack] = useState(false);
  const stackSlotRef = useRef<HTMLDivElement | null>(null);
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem("gymtracker_destination");
      if (destinations.includes(saved as Destination)) setDestination(saved as Destination);
      const search = new URLSearchParams(window.location.search);
      const requested = search.get("next");
      if (destinations.includes(requested as Destination)) setDestination(requested as Destination);
      const oauthError = search.get("oauth_error");
      if (oauthError) setError(oauthErrors[oauthError] ?? "Sign-in could not be completed.");
      if (search.get("session") === "expired") setError("Your session expired. Please sign in again.");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace(destination);
  }, [destination, isAuthenticated, isLoading, router]);

  const resolveIntro = useCallback(() => { setMorphing(false); setIntroReady(true); }, []);
  const beginMorph = useCallback(() => setMorphing(true), []);
  const resetIntro = useCallback(() => { setMorphing(false); setIntroReady(false); }, []);
  const showCssStack = useCallback(() => setCssStack(true), []);
  const updateError = (message: string) => {
    setError(message);
    setNotice("");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090b] text-zinc-100">
      <LoginIntro3D stackSlotRef={stackSlotRef} onReady={resolveIntro} onMorphStart={beginMorph} onReplay={resetIntro} onFallback={showCssStack} />
      <div className={"login-stage relative z-20 " + ((morphing || introReady) ? "" : "pointer-events-none")} aria-hidden={!introReady}>
        <LoginCard destination={destination} visible={morphing || introReady} morphing={morphing} ready={introReady} error={error} notice={notice} onError={updateError} stackSlotRef={stackSlotRef} cssStack={cssStack} />
      </div>
    </main>
  );
}
