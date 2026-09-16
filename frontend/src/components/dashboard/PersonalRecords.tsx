"use client";

import { Card } from "@/components/ui/card";
import { usePersonalRecords } from "@/hooks/useAnalytics";

export function PersonalRecords() {
  const { data: records, isLoading } = usePersonalRecords();

  const prs = records ? [...records].slice(0, 4) : [];

  return (
    <Card className="p-6 border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">
          Personal Records
        </h2>
        <p className="text-sm text-zinc-400">
          Your all-time heaviest lifts
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center py-8 space-y-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-xs text-zinc-500">Loading records...</p>
          </div>
        ) : prs.length === 0 ? (
          <div className="text-zinc-500 text-sm py-8 text-center border border-dashed border-zinc-800 rounded-2xl">
            No personal records found yet. Lift heavy to set PRs!
          </div>
        ) : (
          prs.map((record) => {
            const formattedDate = new Date(record.max_weight_date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={record.exercise_id}
                className="flex items-center justify-between border-b border-zinc-800 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <span className="text-zinc-200 font-medium">
                    {record.exercise_name}
                  </span>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Set on {formattedDate}
                  </div>
                </div>

                <span className="font-extrabold text-emerald-400 text-lg">
                  {record.max_weight} kg
                </span>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
