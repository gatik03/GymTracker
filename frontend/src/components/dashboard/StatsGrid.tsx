"use client";

import { StatCard } from "./StatCard";
import { Button } from "@/components/ui/button";
import { useMonthlyVolume, usePersonalRecords } from "@/hooks/useAnalytics";
import { calculateWorkoutStreak, useWorkoutSessions } from "@/hooks/useWorkouts";

export function StatsGrid() {
  const monthlyQuery = useMonthlyVolume();
  const recordsQuery = usePersonalRecords();
  const sessionsQuery = useWorkoutSessions();
  const { data: monthlyVolume, isLoading: isMonthlyLoading } = monthlyQuery;
  const { data: prs, isLoading: isPrsLoading } = recordsQuery;
  const { data: sessions, isLoading: isSessionsLoading } = sessionsQuery;

  const isLoading = isMonthlyLoading || isPrsLoading || isSessionsLoading;

  const now = new Date();
  const currentMonthKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const currentMonth = monthlyVolume?.find((item) => item.month.slice(0, 7) === currentMonthKey);
  const currentMonthVolume = currentMonth
    ? currentMonth.total_volume.toLocaleString() + " kg"
    : "0 kg";

  const streakDays = calculateWorkoutStreak(sessions ?? []);
  const streak = `${streakDays} day${streakDays === 1 ? "" : "s"}`;

  const prsCount = prs ? prs.length.toString() : "0";

  const workoutsThisMonth = (() => {
    if (!sessions) return "0";
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const count = sessions.filter(s => {
      const d = new Date(`${s.date}T00:00:00`);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    return count.toString();
  })();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 h-28" />
        ))}
      </div>
    );
  }

  if (monthlyQuery.isError || recordsQuery.isError || sessionsQuery.isError) {
    return <div role="alert" className="space-y-3 rounded-lg border border-border p-4"><p className="text-sm text-red-300">Training statistics could not be loaded.</p><Button variant="outline" onClick={() => { void monthlyQuery.refetch(); void recordsQuery.refetch(); void sessionsQuery.refetch(); }}>Retry</Button></div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatCard title="Monthly volume" value={currentMonthVolume} />
      <StatCard title="Workout streak" value={streak} />
      <StatCard title="Exercises with records" value={prsCount} />
      <StatCard title="Workouts this month" value={workoutsThisMonth} />
    </div>
  );
}
