"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useWorkoutSessions } from "@/hooks/useWorkouts";

export function ActivityFeed() {
  const { data: sessions, isLoading } = useWorkoutSessions();

  const candidates = (sessions ?? [])
    .flatMap((session) =>
      session.sets.map((set) => ({
        ...set,
        workoutId: session.id,
        workoutDate: session.date,
      })),
    )
    .filter((set) => set.reps >= 8)
    .sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime();
    });

  const seenExercises = new Set<number>();
  const heavyHits = candidates
    .filter((set) => {
      if (seenExercises.has(set.exercise)) return false;
      seenExercises.add(set.exercise);
      return true;
    })
    .slice(0, 2);

  return (
    <Card className="p-6 border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Heavy Hits</h2>
        <p className="text-sm text-zinc-400">
          Your strongest performances at eight or more reps
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-8 space-y-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-zinc-500">Loading performances…</p>
        </div>
      ) : heavyHits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-8 text-center text-sm text-zinc-500">
          Log sets of eight or more reps to see your heavy hits.
        </div>
      ) : (
        <div className="space-y-3">
          {heavyHits.map((set) => (
            <Link
              key={set.id}
              href={`/workouts/${set.workoutId}`}
              className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4 transition hover:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div>
                <p className="font-semibold text-white">{set.exercise_name}</p>
                <p className="mt-1 text-xs capitalize text-zinc-500">
                  {set.exercise_muscle_group.replace(/_/g, " ")}
                </p>
              </div>
              <p className="text-lg font-bold text-emerald-400">
                {set.weight} kg × {set.reps}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
