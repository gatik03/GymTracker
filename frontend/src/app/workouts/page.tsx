import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

import { WorkoutList } from "@/components/workouts/WorkoutList";

export default function WorkoutsPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">
            Workouts
          </h1>

          <Button>
            New Workout
          </Button>
        </div>

        <WorkoutList />
      </div>
    </AppLayout>
  );
}
