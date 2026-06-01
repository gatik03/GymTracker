import { Card } from "@/components/ui/card";

type Props = {
  name: string;
  date: string;
  exercises: number;
  sets: number;
};

export function WorkoutCard({
  name,
  date,
  exercises,
  sets,
}: Props) {
  return (
    <Card className="p-5">
      <h3 className="text-xl font-semibold">
        {name}
      </h3>

      <p className="text-muted-foreground">
        {date}
      </p>

      <div className="mt-4 flex gap-6 text-sm">
        <span>{exercises} exercises</span>

        <span>{sets} sets</span>
      </div>
    </Card>
  );
}
