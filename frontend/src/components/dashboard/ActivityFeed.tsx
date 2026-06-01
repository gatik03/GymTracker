import { Card } from "@/components/ui/card";

const activities = [
  "Bench Press PR achieved",
  "Push Day completed",
  "Workout streak reached 10",
  "Volume increased 12%",
];

export function ActivityFeed() {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-semibold">
        Activity Feed
      </h2>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity}
            className="
              rounded-lg
              border
              p-3
            "
          >
            {activity}
          </div>
        ))}
      </div>
    </Card>
  );
}
