"use client";

import { StatCard } from "./StatCard";
import { useMonthlyVolume, usePersonalRecords } from "@/hooks/useAnalytics";
import { calculateWorkoutStreak, useWorkoutSessions } from "@/hooks/useWorkouts";

export function StatsGrid() {
  const { data: monthlyVolume, isLoading: isMonthlyLoading } = useMonthlyVolume();
  const { data: prs, isLoading: isPrsLoading } = usePersonalRecords();
  const { data: sessions, isLoading: isSessionsLoading } = useWorkoutSessions();

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
      const d = new Date(s.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    return count.toString();
  })();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Monthly Volume" value={currentMonthVolume} />
      <StatCard title="Workout Streak" value={streak} />
      <StatCard title="Personal Records" value={prsCount} />
      <StatCard title="Workouts This Month" value={workoutsThisMonth} />
    </div>
  );
}
