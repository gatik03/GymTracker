"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock3, Dumbbell, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewWorkoutDialog } from "@/components/workouts/NewWorkoutDialog";
import { WorkoutList } from "@/components/workouts/WorkoutList";
import { useActiveWorkoutDraft, useDeleteWorkout } from "@/hooks/useWorkouts";
import { getApiErrorMessage } from "@/lib/apiErrors";

export default function WorkoutsPage() {
  const [newWorkoutOpen, setNewWorkoutOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeWorkout = useActiveWorkoutDraft();
  const deleteWorkout = useDeleteWorkout();

  const discardDraft = async () => {
    if (!activeWorkout.data) return;
    setError(null);
    try {
      await deleteWorkout.mutateAsync(activeWorkout.data.id);
      setDiscardOpen(false);
    } catch (discardError) {
      setError(getApiErrorMessage(discardError, "The workout draft could not be discarded."));
    }
  };

  return (
    <AppLayout>
      <main className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">Training</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">Workouts</h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-500">
              Log the work while it is happening, then return here to review completed sessions.
            </p>
          </div>
          <Button
            onClick={() => setNewWorkoutOpen(true)}
            disabled={Boolean(activeWorkout.data) || activeWorkout.isLoading}
            className="bg-emerald-500 font-semibold text-zinc-950 hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" /> New workout
          </Button>
        </header>

        {error ? (
          <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {activeWorkout.isLoading ? (
          <Card className="flex min-h-40 animate-pulse items-center justify-center border-zinc-800 bg-zinc-900/40 text-sm text-zinc-500">
            Checking for an active workout…
          </Card>
        ) : activeWorkout.isError ? (
          <Card className="border-red-500/20 bg-red-500/[0.06] p-5">
            <p className="font-medium text-zinc-100">Could not check your active workout.</p>
            <p className="mt-1 text-sm text-zinc-500">Retry before starting a second session.</p>
            <Button variant="outline" className="mt-4 border-zinc-700" onClick={() => void activeWorkout.refetch()}>
              <RotateCcw className="h-4 w-4" /> Retry
            </Button>
          </Card>
        ) : activeWorkout.data ? (
          <Card className="relative overflow-hidden border-emerald-500/25 bg-emerald-500/[0.06] p-5 sm:p-6">
            <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400" aria-hidden="true" />
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Workout in progress
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-50">{activeWorkout.data.title}</h2>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-400">
                  <span className="inline-flex items-center gap-1.5"><Dumbbell className="h-4 w-4" /> {activeWorkout.data.exercise_count} exercises</span>
                  <span>{activeWorkout.data.total_sets} sets</span>
                  <span>{activeWorkout.data.total_volume.toLocaleString()} kg</span>
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> {activeWorkout.data.duration_minutes} min</span>
                </div>
                <p className="mt-3 text-sm text-zinc-500">Every logged set is already saved.</p>
              </div>
              <div className="flex flex-col gap-2 sm:min-w-44">
                <Link
                  href={`/workouts/${activeWorkout.data.id}`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  Resume workout
                </Link>
                <Button variant="ghost" className="text-zinc-400 hover:text-red-300" onClick={() => setDiscardOpen(true)}>
                  <Trash2 className="h-4 w-4" /> Discard
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        <section aria-labelledby="workout-history-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="workout-history-title" className="text-xl font-semibold text-zinc-100">Workout history</h2>
              <p className="mt-1 text-sm text-zinc-500">Only finished sessions contribute to history and progress.</p>
            </div>
          </div>
          <WorkoutList />
        </section>

        <NewWorkoutDialog open={newWorkoutOpen} onOpenChange={setNewWorkoutOpen} />

        <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
          <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-100">
            <DialogHeader>
              <DialogTitle>Discard this workout?</DialogTitle>
              <DialogDescription className="text-zinc-400">
                The workout and all logged sets will be permanently removed. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" className="border-zinc-700" onClick={() => setDiscardOpen(false)} disabled={deleteWorkout.isPending}>
                Keep workout
              </Button>
              <Button variant="destructive" onClick={() => void discardDraft()} disabled={deleteWorkout.isPending}>
                {deleteWorkout.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Discarding…</> : "Discard workout"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </AppLayout>
  );
}
