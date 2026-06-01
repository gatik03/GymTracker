import { Card } from "@/components/ui/card";

const records = [
  {
    lift: "Bench Press",
    value: "100 kg",
  },
  {
    lift: "Squat",
    value: "140 kg",
  },
  {
    lift: "Deadlift",
    value: "180 kg",
  },
];

export function PersonalRecords() {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-semibold">
        Personal Records
      </h2>

      <div className="space-y-4">
        {records.map((record) => (
          <div
            key={record.lift}
            className="flex justify-between"
          >
            <span>
              {record.lift}
            </span>

            <span className="font-bold">
              {record.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
