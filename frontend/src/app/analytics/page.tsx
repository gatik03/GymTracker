"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import {
  useExerciseProgress,
  usePersonalRecords,
  useVolumePerMuscleGroup,
  useWeeklyVolume,
} from "@/hooks/useAnalytics";
import { ExercisePicker } from "@/components/workouts/ExercisePicker";
import { format, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MUSCLE_COLORS = [
  "#10b981",
  "#22d3ee",
  "#f59e0b",
  "#a78bfa",
  "#f472b6",
  "#60a5fa",
  "#fb7185",
  "#a1a1aa",
];

type ProgressTab = "overview" | "exercises" | "records";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<ProgressTab>("overview");
  const [selectedExerciseName, setSelectedExerciseName] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState(0);

  const weeklyVolume = useWeeklyVolume();
  const muscleVolume = useVolumePerMuscleGroup();
  const personalRecords = usePersonalRecords();
  const exerciseProgress = useExerciseProgress(selectedExerciseId);

  const muscleData = (muscleVolume.data ?? []).map((item) => ({
    name: item.muscle_group.replace(/_/g, " "),
    value: item.total_volume,
  }));

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Progress
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Are you getting better?
          </h1>
          <p className="max-w-2xl text-zinc-400">
            Follow strength, training volume, muscle distribution, and personal records from your logged workouts.
          </p>
        </header>

        <div className="flex gap-6 border-b border-zinc-800" role="tablist" aria-label="Progress views">
          {(["overview", "exercises", "records"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-4 text-sm font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTab === tab ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-500" />
              )}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="mb-1 text-lg font-semibold text-white">Weekly volume</h2>
              <p className="mb-5 text-sm text-zinc-500">Weight × reps across completed sessions</p>
              <div className="h-72">
                {weeklyVolume.isLoading ? (
                  <ChartState message="Loading volume…" />
                ) : weeklyVolume.isError ? (
                  <ChartState message="Volume could not be loaded." />
                ) : !weeklyVolume.data?.length ? (
                  <ChartState message="Log a workout to start your volume history." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyVolume.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis tickFormatter={(value: string) => format(parseISO(value), "MMM d")} dataKey="week" stroke="#71717a" fontSize={11} />
                      <YAxis stroke="#71717a" fontSize={11} width={56} />
                      <Tooltip labelFormatter={(value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) ? format(parseISO(value), "MMM d, yyyy") : value} contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} />
                      <Bar dataKey="total_volume" name="Volume (kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="mb-1 text-lg font-semibold text-white">Muscle distribution</h2>
              <p className="mb-5 text-sm text-zinc-500">Where your logged training volume went</p>
              <div className="h-72">
                {muscleVolume.isLoading ? (
                  <ChartState message="Loading muscle volume…" />
                ) : muscleVolume.isError ? (
                  <ChartState message="Muscle volume could not be loaded." />
                ) : muscleData.length === 0 ? (
                  <ChartState message="No muscle volume is available yet." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={muscleData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2}>
                        {muscleData.map((item, index) => (
                          <Cell key={item.name} fill={MUSCLE_COLORS[index % MUSCLE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip labelFormatter={(value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) ? format(parseISO(value), "MMM d, yyyy") : value} contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "exercises" && (
          <div className="space-y-6">
            <Card className="overflow-visible border-zinc-800 bg-zinc-900/50 p-6">
              <ExercisePicker value={selectedExerciseId} selectedName={selectedExerciseName} onChange={(exercise) => { setSelectedExerciseId(exercise.id); setSelectedExerciseName(exercise.name); }} />
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold text-white">Exercise progression</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Actual session weight and volume, plus a clearly labelled Epley estimated 1RM.
              </p>
              <div className="mt-5 h-80">
                {!selectedExerciseId ? (
                  <ChartState message="Choose an exercise to view its progression." />
                ) : exerciseProgress.isLoading ? (
                  <ChartState message="Loading exercise history…" />
                ) : exerciseProgress.isError ? (
                  <ChartState message="Exercise history could not be loaded." />
                ) : !exerciseProgress.data?.length ? (
                  <ChartState message="No logged sets exist for this exercise yet." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={exerciseProgress.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis tickFormatter={(value: string) => format(parseISO(value), "MMM d")} dataKey="date" stroke="#71717a" fontSize={11} />
                      <YAxis yAxisId="strength" stroke="#71717a" fontSize={11} width={48} />
                      <YAxis yAxisId="volume" orientation="right" stroke="#71717a" fontSize={11} width={64} />
                      <Tooltip labelFormatter={(value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) ? format(parseISO(value), "MMM d, yyyy") : value} contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} />
                      <Line yAxisId="strength" type="monotone" dataKey="max_weight" name="Max weight (kg)" stroke="#22d3ee" strokeWidth={2.5} />
                      <Line yAxisId="strength" type="monotone" dataKey="estimated_1rm" name="Estimated 1RM (kg)" stroke="#10b981" strokeWidth={2.5} />
                      <Line yAxisId="volume" type="monotone" dataKey="total_volume" name="Volume (kg)" stroke="#a78bfa" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "records" && (
          <Card className="border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Personal records</h2>
            <p className="mt-1 text-sm text-zinc-500">Heaviest logged set and estimated 1RM for each exercise</p>
            {personalRecords.isLoading ? (
              <div className="py-12"><ChartState message="Loading records…" /></div>
            ) : personalRecords.isError ? (
              <div className="py-12"><ChartState message="Personal records could not be loaded." /></div>
            ) : !personalRecords.data?.length ? (
              <div className="py-12"><ChartState message="Your records will appear after you log sets." /></div>
            ) : (
              <div className="mt-6 divide-y divide-zinc-800">
                {personalRecords.data.map((record) => (
                  <div key={record.exercise_id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-8">
                    <div>
                      <p className="font-medium text-white">{record.exercise_name}</p>
                      <p className="mt-1 text-xs capitalize text-zinc-500">{record.muscle_group.replace(/_/g, " ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Heaviest set</p>
                      <p className="font-semibold text-zinc-200">{record.max_weight} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Estimated 1RM</p>
                      <p className="font-semibold text-emerald-400">{record.max_estimated_1rm} kg</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function ChartState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-24 items-center justify-center text-center text-sm text-zinc-500">
      {message}
    </div>
  );
}
