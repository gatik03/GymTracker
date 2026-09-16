"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Clock3, Dumbbell, Hash, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useDeleteWorkout } from "@/hooks/useWorkouts";
import { getApiErrorMessage } from "@/lib/apiErrors";

interface WorkoutCardProps {
  id: number;
  name: string;
  workoutType: string;
  date: string;
  exercises: number;
  sets: number;
  volume: number;
  duration: number;
}

export function WorkoutCard({ id, name, workoutType, date, exercises, sets, volume, duration }: WorkoutCardProps) {
  const deleteWorkout = useDeleteWorkout();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${name}? This permanently removes the workout and its sets.`)) return;
    setError(null);
    try {
      await deleteWorkout.mutateAsync(id);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "The workout could not be deleted."));
    }
  };

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      <Card className="group relative overflow-hidden border-zinc-800 bg-zinc-900/35 transition hover:border-zinc-700 hover:bg-zinc-900/55">
        <Link href={`/workouts/${id}`} className="block p-5 pr-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/50" aria-label={`Open ${name} workout details`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                {workoutType.replace("_", " ")}
              </span>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-zinc-100">{name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500"><Calendar className="h-3.5 w-3.5" /> {formattedDate}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm text-zinc-500 sm:grid-cols-4">
              <span className="flex items-center gap-1.5"><Dumbbell className="h-4 w-4 text-emerald-500" /><strong className="text-zinc-300">{exercises}</strong> exercises</span>
              <span className="flex items-center gap-1.5"><Hash className="h-4 w-4 text-zinc-600" /><strong className="text-zinc-300">{sets}</strong> sets</span>
              <span className="text-zinc-500"><strong className="text-zinc-300">{volume.toLocaleString()}</strong> kg</span>
              <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-zinc-600" /><strong className="text-zinc-300">{duration}</strong> min</span>
            </div>
          </div>
        </Link>
        <button
          type="button"
          aria-label={`Delete ${name}`}
          onClick={() => void handleDelete()}
          disabled={deleteWorkout.isPending}
          className="absolute right-3 top-3 rounded-lg p-2 text-zinc-600 transition hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </Card>
      {error ? <p role="alert" className="mt-2 px-2 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
