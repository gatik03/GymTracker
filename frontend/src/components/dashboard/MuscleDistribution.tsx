"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Card } from "@/components/ui/card";

const data = [
  { name: "Chest", value: 22 },
  { name: "Back", value: 18 },
  { name: "Shoulders", value: 12 },
  { name: "Biceps", value: 8 },
  { name: "Triceps", value: 10 },
  { name: "Legs", value: 16 },
  { name: "Core", value: 6 },
];

const COLORS = [
  "#5B6CFF",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#8B5CF6",
  "#EC4899",
];

export function MuscleDistribution() {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-semibold">
        Muscle Distribution
      </h2>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index]}
                />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
