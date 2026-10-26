"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWorkoutSessions } from "@/hooks/useWorkouts";

export function RecentWorkouts() {
  const { data: sessions, isLoading, isError, refetch } = useWorkoutSessions();

  const recentSessions = sessions
    ? [...sessions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4)
    : [];

  return (
    <Card className="p-6 border-zinc-800 bg-zinc-900/50">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">
          Recent Workouts
        </h2>
        <p className="text-sm text-zinc-400">
          Your latest training sessions
        </p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center py-8 space-y-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-xs text-zinc-500">Loading workouts...</p>
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-3 text-sm text-red-300"><p>Workout history could not be loaded.</p><Button variant="outline" onClick={() => void refetch()}>Retry</Button></div>
        ) : recentSessions.length === 0 ? (
          <div className="text-zinc-500 text-sm py-8 text-center border border-dashed border-zinc-800 rounded-2xl">
            Finish your first workout and it will appear here. Use Start workout above to begin.
          </div>
        ) : (
          recentSessions.map((workout) => {
            const exerciseCount = new Set(workout.sets?.map((s) => s.exercise)).size;
            const formattedDate = new Date(`${workout.date}T00:00:00`).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <Link
                key={workout.id}
                href={`/workouts/${workout.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950 p-4 transition hover:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="min-w-0">
                  <div className="break-words font-semibold text-white">
                    {workout.title}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {formattedDate} • {workout.workout_type.toUpperCase()}
                  </div>
                </div>

                <span className="text-sm text-emerald-400 font-medium">
                  {exerciseCount} exercise{exerciseCount !== 1 && "s"}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </Card>
  );
}
