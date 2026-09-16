"use client";

import { useState } from "react";
import { Code2, Loader2 } from "lucide-react";

import { getApiErrorMessage } from "@/lib/apiErrors";
import { OAuthProvider, startOAuth } from "@/services/auth/authService";

interface OAuthButtonsProps {
  destination: string;
  onError: (message: string) => void;
  label?: "continue" | "connect";
}

export function OAuthButtons({
  destination,
  onError,
  label = "continue",
}: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  const handleOAuth = async (provider: OAuthProvider) => {
    if (loadingProvider) return;
    setLoadingProvider(provider);
    onError("");
    try {
      await startOAuth(provider, destination);
    } catch (error: unknown) {
      onError(getApiErrorMessage(error, `Could not connect to ${provider}. Please try again.`));
      setLoadingProvider(null);
    }
  };

  const action = label === "connect" ? "Connect" : "Continue with";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        disabled={loadingProvider !== null}
        onClick={() => void handleOAuth("google")}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingProvider === "google" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-zinc-900" aria-hidden="true">
            G
          </span>
        )}
        {action} Google
      </button>
      <button
        type="button"
        disabled={loadingProvider !== null}
        onClick={() => void handleOAuth("github")}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingProvider === "github" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Code2 className="h-5 w-5" aria-hidden="true" />
        )}
        {action} GitHub
      </button>
    </div>
  );
}
