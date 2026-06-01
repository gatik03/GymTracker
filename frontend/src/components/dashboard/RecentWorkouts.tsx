import { Card } from "@/components/ui/card";

const workouts = [
  {
    name: "Push Day",
    exercises: 5,
  },
  {
    name: "Pull Day",
    exercises: 6,
  },
  {
    name: "Leg Day",
    exercises: 4,
  },
];

export function RecentWorkouts() {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-semibold">
        Recent Workouts
      </h2>

      <div className="space-y-3">
        {workouts.map((workout) => (
          <div
            key={workout.name}
            className="
              flex
              items-center
              justify-between
              rounded-lg
              border
              p-4
            "
          >
            <span>
              {workout.name}
            </span>

            <span className="text-muted-foreground">
              {workout.exercises}
              {" "}Exercises
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
