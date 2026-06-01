import { StatCard } from "./StatCard";

export function StatsGrid() {
  return (
    <div
      className="
        grid
        gap-4
        md:grid-cols-2
        xl:grid-cols-4
      "
    >
      <StatCard
        title="Weekly Volume"
        value="14,520 kg"
      />

      <StatCard
        title="Workout Streak"
        value="12 days"
      />

      <StatCard
        title="Personal Records"
        value="18"
      />

      <StatCard
        title="Workouts This Month"
        value="16"
      />
    </div>
  );
}
