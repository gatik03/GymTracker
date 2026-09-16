"use client";

import { type FormEvent, useEffect, useState } from "react";
import { CalendarDays, Info, Loader2, Plus, RefreshCw, Scale, Trash2, TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AccountConnections } from "@/components/auth/AccountConnections";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useBodyWeightLogs, useBodyWeightRate, useBodyWeightTrend, useCreateWeightLog, useDeleteWeightLog } from "@/hooks/useBodyWeight";
import { getApiErrorMessage } from "@/lib/apiErrors";

type WeightUnit = "kg" | "lbs";

function localToday() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function displayWeight(value: number | null | undefined, unit: WeightUnit) {
  if (value === null || value === undefined) return null;
  const converted = unit === "lbs" ? value * 2.20462 : value;
  return Math.round(converted * 10) / 10;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [unit, setUnit] = useState<WeightUnit>("kg");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [weightValue, setWeightValue] = useState("");
  const [dateValue, setDateValue] = useState(localToday);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");

  const logsQuery = useBodyWeightLogs();
  const trendQuery = useBodyWeightTrend();
  const rateQuery = useBodyWeightRate();
  const createWeight = useCreateWeightLog();
  const deleteWeight = useDeleteWeightLog();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem("weight_unit");
      if (saved === "kg" || saved === "lbs") setUnit(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleUnit = () => {
    const nextUnit = unit === "kg" ? "lbs" : "kg";
    setUnit(nextUnit);
    window.localStorage.setItem("weight_unit", nextUnit);
  };

  const openWeightDialog = () => {
    setWeightValue("");
    setDateValue(localToday());
    setFormError("");
    setDialogOpen(true);
  };

  const createEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entered = Number(weightValue);
    if (!Number.isFinite(entered) || entered <= 0) {
      setFormError("Enter a valid weight.");
      return;
    }
    const kilograms = unit === "lbs" ? entered / 2.20462 : entered;
    if (kilograms < 20 || kilograms > 500) {
      setFormError(`Enter a weight between ${unit === "kg" ? "20 and 500 kg" : "44 and 1,102 lbs"}.`);
      return;
    }

    setFormError("");
    try {
      await createWeight.mutateAsync({ weight: kilograms, date: dateValue });
      setDialogOpen(false);
    } catch (error) {
      setFormError(getApiErrorMessage(error, "The weight entry could not be saved."));
    }
  };

  const removeEntry = async (id: number, date: string) => {
    if (!window.confirm(`Delete the weight entry from ${formatDate(date)}?`)) return;
    setPageError("");
    try {
      await deleteWeight.mutateAsync(id);
    } catch (error) {
      setPageError(getApiErrorMessage(error, "The weight entry could not be deleted."));
    }
  };

  const isLoading = logsQuery.isLoading || trendQuery.isLoading || rateQuery.isLoading;
  const hasError = logsQuery.isError || trendQuery.isError || rateQuery.isError;
  const retryAll = () => {
    void logsQuery.refetch();
    void trendQuery.refetch();
    void rateQuery.refetch();
  };
  const chartData = (trendQuery.data ?? []).map((entry) => ({
    date: formatDate(entry.date),
    weight: displayWeight(entry.weight, unit),
  }));
  const rate = rateQuery.data;
  const logs = logsQuery.data ?? [];

  return (
    <AppLayout>
      <main className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Profile</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 text-lg font-semibold uppercase text-emerald-300" aria-hidden="true">
                {user?.username?.charAt(0) || "U"}
              </span>
              <h1 className="min-w-0 truncate text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
                {user?.username || "Your profile"}
              </h1>
            </div>
            <p className="mt-2 text-sm text-zinc-500">Account connections, units, and a focused bodyweight trend.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="border-zinc-800" onClick={toggleUnit} aria-label={`Switch weight unit from ${unit}`}>
              <Scale className="h-4 w-4 text-emerald-400" /> {unit.toUpperCase()}
            </Button>
            <Button className="bg-emerald-400 font-semibold text-zinc-950 hover:bg-emerald-300" onClick={openWeightDialog}>
              <Plus className="h-4 w-4" /> Log weight
            </Button>
          </div>
        </header>

        <AccountConnections />

        {pageError ? <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{pageError}</div> : null}

        <section aria-labelledby="bodyweight-title" className="space-y-4">
          <div>
            <h2 id="bodyweight-title" className="text-xl font-semibold text-zinc-100">Bodyweight</h2>
            <p className="mt-1 text-sm text-zinc-500">A simple view of where you are and how the last 30 days changed.</p>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/30" />)}
            </div>
          ) : hasError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-6 py-12 text-center">
              <p className="font-semibold text-zinc-100">Bodyweight data could not be loaded</p>
              <p className="mt-1 text-sm text-zinc-500">Check your connection and try again.</p>
              <Button variant="outline" className="mt-4 border-zinc-700" onClick={retryAll}><RefreshCw className="h-4 w-4" /> Retry</Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-zinc-800 bg-zinc-900/40 p-5"><p className="text-xs uppercase tracking-wider text-zinc-600">Current</p><p className="mt-2 text-2xl font-semibold text-zinc-100">{rate?.current_weight !== null && rate?.current_weight !== undefined ? `${displayWeight(rate.current_weight, unit)} ${unit}` : "—"}</p></Card>
                <Card className="border-zinc-800 bg-zinc-900/40 p-5"><p className="text-xs uppercase tracking-wider text-zinc-600">30-day change</p><p className="mt-2 text-2xl font-semibold text-zinc-100">{rate ? `${rate.total_change > 0 ? "+" : ""}${displayWeight(rate.total_change, unit)} ${unit}` : "—"}</p></Card>
                <Card className="border-zinc-800 bg-zinc-900/40 p-5"><p className="text-xs uppercase tracking-wider text-zinc-600">Weekly trend</p><p className="mt-2 text-2xl font-semibold text-zinc-100">{rate ? `${rate.rate_per_week > 0 ? "+" : ""}${displayWeight(rate.rate_per_week, unit)} ${unit}` : "—"}</p></Card>
              </div>

              <Card className="border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="flex items-center gap-2 font-semibold text-zinc-100"><TrendingUp className="h-4 w-4 text-emerald-400" /> Historical trend</h3><p className="mt-1 text-xs text-zinc-600">Every recorded measurement</p></div>
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-600"><Info className="h-3.5 w-3.5" /> Stored in kg</span>
                </div>
                <div className="mt-5 h-72">
                  {chartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-800 text-center text-sm text-zinc-500">Start tracking your weight to see a trend.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 6, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 2", "dataMax + 2"]} />
                        <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#3f3f46", borderRadius: "0.75rem", color: "#fafafa" }} />
                        <Line type="monotone" dataKey="weight" name={`Weight (${unit})`} stroke="#34d399" strokeWidth={3} dot={{ r: 3, fill: "#09090b", stroke: "#34d399", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
                <h3 className="flex items-center gap-2 font-semibold text-zinc-100"><CalendarDays className="h-4 w-4 text-emerald-400" /> Entries</h3>
                {logs.length === 0 ? (
                  <p className="mt-5 rounded-xl border border-dashed border-zinc-800 py-8 text-center text-sm text-zinc-500">No bodyweight records yet.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-zinc-800/70">
                    {logs.map((entry) => (
                      <li key={entry.id} className="flex items-center justify-between gap-4 py-3">
                        <div><p className="font-medium text-zinc-200">{displayWeight(entry.weight, unit)} {unit}</p><p className="mt-0.5 text-xs text-zinc-600">{formatDate(entry.date)}</p></div>
                        <button type="button" aria-label={`Delete weight entry from ${entry.date}`} onClick={() => void removeEntry(entry.id, entry.date)} disabled={deleteWeight.isPending} className="rounded-lg p-2 text-zinc-600 transition hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
          )}
        </section>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm border-zinc-800 bg-zinc-950 text-zinc-100">
            <DialogHeader><DialogTitle>Log bodyweight</DialogTitle><DialogDescription className="text-zinc-400">One entry per day. You can delete and replace a mistaken entry.</DialogDescription></DialogHeader>
            <form onSubmit={createEntry} className="space-y-4">
              <div className="space-y-1.5"><label htmlFor="bodyweight-value" className="text-sm font-medium text-zinc-300">Weight ({unit})</label><Input id="bodyweight-value" autoFocus type="number" inputMode="decimal" min={unit === "kg" ? 20 : 44} max={unit === "kg" ? 500 : 1102} step="0.1" required value={weightValue} onChange={(event) => setWeightValue(event.target.value)} placeholder={unit === "kg" ? "75.5" : "165.2"} className="border-zinc-800 bg-zinc-900" /></div>
              <div className="space-y-1.5"><label htmlFor="bodyweight-date" className="text-sm font-medium text-zinc-300">Date</label><Input id="bodyweight-date" type="date" required value={dateValue} onChange={(event) => setDateValue(event.target.value)} className="border-zinc-800 bg-zinc-900" /></div>
              {formError ? <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{formError}</div> : null}
              <DialogFooter className="gap-2"><Button type="button" variant="outline" className="border-zinc-700" onClick={() => setDialogOpen(false)} disabled={createWeight.isPending}>Cancel</Button><Button type="submit" className="bg-emerald-400 font-semibold text-zinc-950 hover:bg-emerald-300" disabled={createWeight.isPending}>{createWeight.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save entry"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </AppLayout>
  );
}
