import { WorkoutCard } from "./WorkoutCard";

const workouts = [
  {
    name: "Push Day",
    date: "May 30",
    exercises: 5,
    sets: 12,
  },
  {
    name: "Pull Day",
    date: "May 28",
    exercises: 6,
    sets: 15,
  },
  {
    name: "Leg Day",
    date: "May 25",
    exercises: 4,
    sets: 10,
  },
];

export function WorkoutList() {
  return (
    <div className="space-y-4">
      {workouts.map((workout) => (
        <WorkoutCard
          key={workout.name}
          {...workout}
        />
      ))}
    </div>
  );
}
