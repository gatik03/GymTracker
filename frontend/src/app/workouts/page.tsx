"use client";

import { useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";

import { Button } from "@/components/ui/button";

import { WorkoutList } from "@/components/workouts/WorkoutList";

import { NewWorkoutDialog } from "@/components/workouts/NewWorkoutDialog";

export default function WorkoutsPage() {
  const [open, setOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">
            Workouts
          </h1>

          <Button
            onClick={() =>
              setOpen(true)
            }
          >
            New Workout
          </Button>
        </div>

        <WorkoutList />

        <NewWorkoutDialog
          open={open}
          onOpenChange={setOpen}
        />
      </div>
    </AppLayout>
  );
}
