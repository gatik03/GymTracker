"use client";

import { Card } from "@/components/ui/card";
import { useWorkoutSessions } from "@/hooks/useWorkouts";

export function RecentWorkouts() {
  const { data: sessions, isLoading } = useWorkoutSessions();

  const recentSessions = sessions
    ? [...sessions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4)
    : [];

  return (
    <Card className="p-6 border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
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
        ) : recentSessions.length === 0 ? (
          <div className="text-zinc-500 text-sm py-8 text-center border border-dashed border-zinc-800 rounded-2xl">
            No workouts logged yet. Start training to see your history!
          </div>
        ) : (
          recentSessions.map((workout) => {
            const exerciseCount = new Set(workout.sets?.map((s) => s.exercise)).size;
            const formattedDate = new Date(workout.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={workout.id}
                className="flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4 transition hover:border-zinc-700"
              >
                <div>
                  <div className="font-semibold text-white">
                    {workout.title}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {formattedDate} • {workout.workout_type.toUpperCase()}
                  </div>
                </div>

                <span className="text-sm text-emerald-400 font-medium">
                  {exerciseCount} Exercise{exerciseCount !== 1 && "s"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
