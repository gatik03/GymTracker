"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWorkoutSessions } from "@/hooks/useWorkouts";
import { WorkoutCard } from "./WorkoutCard";

export function WorkoutList() {
  const workoutsQuery = useWorkoutSessions();
  const sortedWorkouts = workoutsQuery.data
    ? [...workoutsQuery.data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  if (workoutsQuery.isLoading) {
    return (
      <div className="space-y-3" aria-label="Loading workout history">
        {[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/30" />)}
      </div>
    );
  }

  if (workoutsQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-6 py-10 text-center">
        <h3 className="font-semibold text-zinc-100">Workout history could not be loaded</h3>
        <p className="mt-1 text-sm text-zinc-500">Check your connection and try again.</p>
        <Button variant="outline" className="mt-4 border-zinc-700" onClick={() => void workoutsQuery.refetch()}>
          <RotateCcw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  if (sortedWorkouts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-14 text-center">
        <h3 className="font-semibold text-zinc-100">No completed workouts yet</h3>
        <p className="mt-1 text-sm text-zinc-500">Finish your first session and it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedWorkouts.map((workout) => (
        <WorkoutCard
          key={workout.id}
          id={workout.id}
          name={workout.title}
          workoutType={workout.workout_type}
          date={workout.date}
          exercises={workout.exercise_count}
          sets={workout.total_sets}
          volume={workout.total_volume}
          duration={workout.duration_minutes}
        />
      ))}
    </div>
  );
}
