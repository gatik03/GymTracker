"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useActiveWorkoutDraft } from "@/hooks/useWorkouts";
import { Button } from "@/components/ui/button";
import { NewWorkoutDialog } from "@/components/workouts/NewWorkoutDialog";

export function DashboardHero() {
  const { user } = useAuth();
  const activeWorkout = useActiveWorkoutDraft();
  const [newWorkoutOpen, setNewWorkoutOpen] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : "Athlete";

  return (
    <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {getGreeting()}, {displayName}
      </h1>

      <p className="text-lg text-zinc-400">
        {activeWorkout.data ? `${activeWorkout.data.title} is ready to resume. Your logged sets are saved.` : "Start a workout, log your sets, then finish the session to track your progress."}
      </p>
      </div>
      <div className="shrink-0">
        {activeWorkout.data ? (
          <Button asChild><Link href={`/workouts/${activeWorkout.data.id}`}>Resume workout</Link></Button>
        ) : activeWorkout.isError ? (
          <div className="space-y-2"><p role="alert" className="text-sm text-red-300">Could not check your active workout.</p><Button variant="outline" onClick={() => void activeWorkout.refetch()}>Retry</Button></div>
        ) : (
          <Button onClick={() => setNewWorkoutOpen(true)} disabled={activeWorkout.isLoading}>
            <Plus className="h-4 w-4" /> {activeWorkout.isLoading ? "Checking active workout…" : "Start workout"}
          </Button>
        )}
      </div>
      <NewWorkoutDialog open={newWorkoutOpen} onOpenChange={setNewWorkoutOpen} />
    </section>
  );
}
