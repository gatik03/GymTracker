"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateWorkout } from "@/hooks/useWorkouts";
import { getApiErrorMessage } from "@/lib/apiErrors";

interface NewWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function localToday() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export function NewWorkoutDialog({ open, onOpenChange }: NewWorkoutDialogProps) {
  const router = useRouter();
  const createWorkout = useCreateWorkout();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(localToday);
  const [workoutType, setWorkoutType] = useState("custom");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDate(localToday());
    setWorkoutType("custom");
    setNotes("");
    setError(null);
    createWorkout.reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !createWorkout.isPending) reset();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !date) {
      setError("Add a workout name and date to get started.");
      return;
    }

    setError(null);
    try {
      const workout = await createWorkout.mutateAsync({
        title: title.trim(),
        workout_type: workoutType,
        date,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
      reset();
      router.push(`/workouts/${workout.id}`);
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "The workout could not be started. Check your connection and try again.",
        ),
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100 sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight text-white">
            Start a workout
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Give today’s session a name. Your sets will save as you log them.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-1 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="workout-title" className="text-sm font-medium text-zinc-300">
              Workout name
            </label>
            <Input
              id="workout-title"
              autoFocus
              autoComplete="off"
              maxLength={100}
              placeholder="Push day"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="border-zinc-800 bg-zinc-900 text-zinc-100 focus-visible:ring-emerald-500/40"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="workout-date" className="text-sm font-medium text-zinc-300">
                Date
              </label>
              <Input
                id="workout-date"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="border-zinc-800 bg-zinc-900 text-zinc-100 focus-visible:ring-emerald-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="workout-type" className="text-sm font-medium text-zinc-300">
                Type
              </label>
              <select
                id="workout-type"
                value={workoutType}
                onChange={(event) => setWorkoutType(event.target.value)}
                className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              >
                <option value="push">Push</option>
                <option value="pull">Pull</option>
                <option value="legs">Legs</option>
                <option value="upper">Upper</option>
                <option value="lower">Lower</option>
                <option value="full_body">Full body</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="workout-notes" className="text-sm font-medium text-zinc-300">
              Session note <span className="font-normal text-zinc-600">Optional</span>
            </label>
            <textarea
              id="workout-notes"
              maxLength={2000}
              rows={3}
              placeholder="Focus, intent, or anything worth remembering"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>

          <Button
            type="submit"
            disabled={createWorkout.isPending || !title.trim() || !date}
            className="w-full bg-emerald-500 font-semibold text-zinc-950 hover:bg-emerald-400"
          >
            {createWorkout.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</>
            ) : (
              "Start workout"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
