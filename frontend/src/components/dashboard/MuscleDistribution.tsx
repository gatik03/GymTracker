"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useVolumePerMuscleGroup } from "@/hooks/useAnalytics";

const COLORS = [
  "#10b981", // chest
  "#3b82f6", // back
  "#f59e0b", // legs
  "#ec4899", // shoulders
  "#8b5cf6", // triceps
  "#06b6d4", // biceps
  "#ef4444", // core
  "#a1a1aa", // forearms
];

export function MuscleDistribution() {
  const { data, isLoading, isError, refetch } = useVolumePerMuscleGroup();

  const chartData = data?.map((item) => ({
    name: item.muscle_group.replace(/_/g, " "),
    value: item.total_volume,
  })) || [];

  return (
    <Card className="p-6 border-zinc-800 bg-zinc-900/50">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">
          Muscle distribution
        </h2>
        <p className="text-sm text-zinc-400">
          Training volume by target muscle group (kg)
        </p>
      </div>

      <div className={`flex items-center justify-center ${chartData.length || isLoading ? "h-[300px]" : "min-h-24"}`}>
        {isLoading ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-xs text-zinc-500">Loading distribution...</p>
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-3 text-sm text-red-300"><p>Muscle distribution could not be loaded.</p><Button variant="outline" onClick={() => void refetch()}>Retry</Button></div>
        ) : chartData.length === 0 ? (
          <div className="text-zinc-500 text-sm">No volume data logged yet. Complete a session to see your muscle breakdown.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                    stroke="#09090b"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#09090b",
                  borderColor: "#27272a",
                  borderRadius: "1rem",
                  color: "#fff"
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
