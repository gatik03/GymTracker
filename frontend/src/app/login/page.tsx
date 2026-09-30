"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { LoginCard } from "@/components/auth/LoginCard";
import { PlateIntro } from "@/components/auth/PlateIntro";
import { useAuth } from "@/context/AuthContext";

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
  const updateError = (message: string) => {
    setError(message);
    setNotice("");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090b] text-zinc-100">
      <PlateIntro onReady={resolveIntro} onMorphStart={beginMorph} onReplay={resetIntro} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.025),transparent_38%),linear-gradient(to_bottom,transparent_60%,rgba(0,0,0,0.45))]" />
      <div className={"relative z-20 flex min-h-screen items-center justify-center px-4 py-16 transition-opacity duration-700 sm:px-6 " + ((morphing || introReady) ? "opacity-100" : "pointer-events-none opacity-0")} aria-hidden={!introReady}>
        <LoginCard destination={destination} visible={morphing || introReady} morphing={morphing} ready={introReady} error={error} notice={notice} onError={updateError} />
      </div>
    </main>
  );
}
