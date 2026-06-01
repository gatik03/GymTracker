"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { Card } from "@/components/ui/card";

const data = [
  { week: "W1", volume: 8200 },
  { week: "W2", volume: 9100 },
  { week: "W3", volume: 10500 },
  { week: "W4", volume: 12100 },
  { week: "W5", volume: 13800 },
  { week: "W6", volume: 14520 },
];

export function VolumeChart() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Volume Progression
        </h2>

        <p className="text-sm text-muted-foreground">
          Weekly training volume
        </p>
      </div>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis dataKey="week" />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="volume"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
