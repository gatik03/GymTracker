"use client";

import { RotateCcw } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDailyVolume } from "@/hooks/useAnalytics";

export function VolumeChart() {
  const dailyVolume = useDailyVolume();
  const chartData = (dailyVolume.data ?? []).map((item) => ({
    date: new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    volume: item.total_volume,
  }));
  const monthLabel = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <Card className="border-zinc-800 bg-zinc-900/45 p-5 sm:p-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">{monthLabel}</p>
        <h2 className="mt-1 text-xl font-semibold text-zinc-100">Monthly volume</h2>
        <p className="mt-1 text-sm text-zinc-500">Volume on the days you actually trained</p>
      </div>

      <div className="h-72 sm:h-80">
        {dailyVolume.isLoading ? (
          <div className="h-full animate-pulse rounded-xl bg-zinc-950/60" aria-label="Loading monthly volume" />
        ) : dailyVolume.isError ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-medium text-zinc-200">Volume could not be loaded</p>
            <p className="mt-1 text-sm text-zinc-500">Check your connection and retry.</p>
            <Button variant="outline" className="mt-4 border-zinc-700" onClick={() => void dailyVolume.refetch()}><RotateCcw className="h-4 w-4" /> Retry</Button>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-800 text-center text-sm text-zinc-500">
            Complete a workout this month to see your volume trend.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 10, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} width={58} tickFormatter={(value) => Number(value).toLocaleString()} />
              <Tooltip
                cursor={{ stroke: "#3f3f46", strokeDasharray: "4 4" }}
                contentStyle={{ backgroundColor: "#09090b", borderColor: "#3f3f46", borderRadius: "0.75rem", color: "#fafafa" }}
                formatter={(value) => [`${Number(value).toLocaleString()} kg`, "Volume"]}
              />
              <Line type="monotone" dataKey="volume" stroke="#34d399" strokeWidth={3} connectNulls={false} dot={{ r: 4, strokeWidth: 2, stroke: "#34d399", fill: "#09090b" }} activeDot={{ r: 6, strokeWidth: 0, fill: "#34d399" }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
