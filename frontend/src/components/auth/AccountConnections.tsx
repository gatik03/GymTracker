"use client";

import { useEffect, useState } from "react";
import { Check, Code2, Link2, Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/apiErrors";
import {
  getOAuthConnections,
  OAuthProvider,
  startOAuth,
} from "@/services/auth/authService";

const providerLabels: Record<OAuthProvider, string> = {
  google: "Google",
  github: "GitHub",
};

export function AccountConnections() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getOAuthConnections()
      .then((connected) => {
        if (active) setProviders(connected);
      })
      .catch((loadError: unknown) => {
        if (active) setError(getApiErrorMessage(loadError, "Could not load connected accounts."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("oauth_error")) {
        setError("The provider could not be connected. Confirm it is not linked to another account and try again.");
        window.history.replaceState({}, "", "/profile");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const connect = async (provider: OAuthProvider) => {
    setError("");
    setLoadingProvider(provider);
    try {
      await startOAuth(provider, "/profile");
    } catch (connectError: unknown) {
      setError(getApiErrorMessage(connectError, `Could not connect ${providerLabels[provider]}.`));
      setLoadingProvider(null);
    }
  };

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6" aria-labelledby="connected-accounts-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="connected-accounts-title" className="flex items-center gap-2 text-lg font-bold text-white">
            <Link2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            Connected accounts
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Link a provider only after signing in here. GymTracker never stores provider access tokens.
          </p>
        </div>
        <span className="text-xs text-zinc-500">
          {user?.email_verified ? "Email verified" : "Email verification pending"}
        </span>
      </div>

      {error && <div role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(["google", "github"] as OAuthProvider[]).map((provider) => {
          const connected = providers.includes(provider);
          return (
            <button
              key={provider}
              type="button"
              disabled={isLoading || connected || loadingProvider !== null}
              onClick={() => void connect(provider)}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-100 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingProvider === provider ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : connected ? (
                <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              ) : provider === "github" ? (
                <Code2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <span className="font-black" aria-hidden="true">G</span>
              )}
              {connected ? `${providerLabels[provider]} connected` : `Connect ${providerLabels[provider]}`}
            </button>
          );
        })}
      </div>
    </section>
  );
}
