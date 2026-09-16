"use client";

import { useAuth } from "@/context/AuthContext";

export function DashboardHero() {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : "Athlete";

  return (
    <section className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
        Dashboard
      </p>

      <h1 className="text-5xl font-extrabold tracking-tight text-white">
        {getGreeting()}, {displayName}
      </h1>

      <p className="text-lg text-zinc-400">
        Let&apos;s build strength today.
      </p>
    </section>
  );
}