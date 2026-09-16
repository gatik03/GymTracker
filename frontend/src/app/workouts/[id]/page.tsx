"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Check, ChevronDown, Clock3, Dumbbell, Loader2, Plus, Search, Trash2 } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { AnatomyMuscleMap } from "@/components/workouts/AnatomyMuscleMap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateExercise, useCreateExerciseSet, useDeleteExerciseSet, useExercises, useUpdateExerciseSet } from "@/hooks/useExercises";
import { type ExerciseSet, useCompleteWorkout, useDeleteWorkout, useWorkoutSession } from "@/hooks/useWorkouts";
import { getApiErrorMessage } from "@/lib/apiErrors";

interface ExerciseGroup {
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  sets: ExerciseSet[];
}

function formatWorkoutDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatVolume(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

export default function WorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const workoutId = Number(params.id);
  const workoutQuery = useWorkoutSession(workoutId);
  const workout = workoutQuery.data;
  const isDraft = workout?.status === "draft";

  const [exerciseSearch, setExerciseSearch] = useState("");
  const deferredSearch = useDeferredValue(exerciseSearch);
  const exercisesQuery = useExercises({ search: deferredSearch, pageSize: 50 });
  const exercises = exercisesQuery.data?.results ?? [];
  const createExercise = useCreateExercise();
  const createSet = useCreateExerciseSet();
  const updateSet = useUpdateExerciseSet();
  const deleteSet = useDeleteExerciseSet();
  const completeWorkout = useCompleteWorkout();
  const deleteWorkout = useDeleteWorkout();

  const [selectedExercise, setSelectedExercise] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [rir, setRir] = useState("");
  const [setNote, setSetNote] = useState("");
  const [showCustomExercise, setShowCustomExercise] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customMuscle, setCustomMuscle] = useState("chest");
  const [finishOpen, setFinishOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (!isDraft) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDraft]);

  const groups = useMemo<ExerciseGroup[]>(() => {
    const map = new Map<number, ExerciseGroup>();
    for (const workoutSet of workout?.sets ?? []) {
      const current = map.get(workoutSet.exercise);
      if (current) current.sets.push(workoutSet);
      else map.set(workoutSet.exercise, { exerciseId: workoutSet.exercise, exerciseName: workoutSet.exercise_name, muscleGroup: workoutSet.exercise_muscle_group || "full_body", sets: [workoutSet] });
    }
    return Array.from(map.values()).map((group) => ({ ...group, sets: [...group.sets].sort((a, b) => a.set_number - b.set_number) }));
  }, [workout?.sets]);

  const lastLoggedSet = useMemo(() => {
    const sets = workout?.sets ?? [];
    return sets.length ? sets.reduce((latest, item) => item.id > latest.id ? item : latest) : null;
  }, [workout?.sets]);

  const selectedRecord = exercises.find((exercise) => exercise.id === Number(selectedExercise));
  const selectedGroup = groups.find((group) => group.exerciseId === Number(selectedExercise));
  const activeMuscle = selectedRecord?.muscle_group || selectedGroup?.muscleGroup || lastLoggedSet?.exercise_muscle_group || "";
  const activeExerciseName = selectedRecord?.name || selectedGroup?.exerciseName || lastLoggedSet?.exercise_name;

  const selectExercise = (value: string) => {
    setSelectedExercise(value);
    setError(null);
    const previousSets = workout?.sets.filter((item) => item.exercise === Number(value)) ?? [];
    if (previousSets.length) {
      const previous = previousSets.reduce((latest, item) => item.set_number > latest.set_number ? item : latest);
      setWeight(String(previous.weight));
      setReps(String(previous.reps));
    }
  };

  const createCustomExercise = async () => {
    if (!customName.trim()) {
      setError("Enter a name for the custom exercise.");
      return;
    }
    setError(null);
    try {
      const exercise = await createExercise.mutateAsync({ name: customName.trim(), muscle_group: customMuscle });
      setSelectedExercise(String(exercise.id));
      setCustomName("");
      setShowCustomExercise(false);
    } catch (creationError) {
      setError(getApiErrorMessage(creationError, "The custom exercise could not be created."));
    }
  };

  const addSet = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const exerciseId = Number(selectedExercise);
    const parsedWeight = Number(weight);
    const parsedReps = Number(reps);
    const parsedRpe = rpe ? Number(rpe) : null;
    const parsedRir = rir ? Number(rir) : null;
    if (!exerciseId || weight === "" || reps === "") {
      setError("Choose an exercise, then enter weight and reps.");
      return;
    }
    if (!Number.isFinite(parsedWeight) || parsedWeight < 0 || parsedWeight > 2000) {
      setError("Weight must be between 0 and 2,000 kg.");
      return;
    }
    if (!Number.isInteger(parsedReps) || parsedReps < 1 || parsedReps > 1000) {
      setError("Reps must be a whole number between 1 and 1,000.");
      return;
    }
    if (parsedRpe !== null && (parsedRpe < 1 || parsedRpe > 10)) {
      setError("RPE must be between 1 and 10.");
      return;
    }
    if (parsedRir !== null && (!Number.isInteger(parsedRir) || parsedRir < 0 || parsedRir > 10)) {
      setError("RIR must be a whole number between 0 and 10.");
      return;
    }
    const numbers = workout?.sets.filter((item) => item.exercise === exerciseId).map((item) => item.set_number) ?? [];
    const nextSetNumber = Math.max(0, ...numbers) + 1;
    setError(null);
    setSaveMessage(null);
    try {
      await createSet.mutateAsync({ workout_session: workoutId, exercise: exerciseId, set_number: nextSetNumber, weight: parsedWeight, reps: parsedReps, rpe: parsedRpe, rir: parsedRir, notes: setNote.trim() });
      setRpe("");
      setRir("");
      setSetNote("");
      setSaveMessage(`Set ${nextSetNumber} saved`);
    } catch (creationError) {
      setError(getApiErrorMessage(creationError, "That set could not be saved. Please try again."));
    }
  };

  const editSet = async (set: ExerciseSet, field: "weight" | "reps", value: string) => {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue) || nextValue < 0 || (field === "reps" && (!Number.isInteger(nextValue) || nextValue < 1))) {
      setError(`Enter a valid ${field} value.`);
      return;
    }
    if (nextValue === set[field]) return;
    setError(null);
    try {
      await updateSet.mutateAsync({ id: set.id, data: { [field]: nextValue } });
      setSaveMessage("Changes saved");
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, "The set could not be updated."));
    }
  };

  const removeSet = async (setId: number) => {
    if (!window.confirm("Delete this set? This cannot be undone.")) return;
    setError(null);
    try {
      await deleteSet.mutateAsync(setId);
      setSaveMessage("Set deleted");
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "The set could not be deleted."));
    }
  };

  const finishWorkout = async () => {
    setError(null);
    try {
      await completeWorkout.mutateAsync(workoutId);
      setFinishOpen(false);
      setJustCompleted(true);
    } catch (completionError) {
      setFinishOpen(false);
      setError(getApiErrorMessage(completionError, "The workout could not be completed."));
    }
  };

  const removeWorkout = async () => {
    const label = isDraft ? "Discard this workout and every logged set?" : "Delete this completed workout?";
    if (!window.confirm(`${label} This cannot be undone.`)) return;
    try {
      await deleteWorkout.mutateAsync(workoutId);
      router.push("/workouts");
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "The workout could not be removed."));
    }
  };

  if (workoutQuery.isLoading) {
    return <AppLayout><div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-400" /><p className="mt-3 text-sm text-zinc-500">Loading workout…</p></div></div></AppLayout>;
  }

  if (workoutQuery.isError || !workout) {
    return <AppLayout><div className="mx-auto max-w-lg py-20 text-center"><h1 className="text-xl font-semibold text-zinc-100">Workout not found</h1><p className="mt-2 text-sm text-zinc-500">It may have been removed, or it may belong to another account.</p><Link href="/workouts" className="mt-5 inline-flex text-sm font-medium text-emerald-400 hover:text-emerald-300">Back to workouts</Link></div></AppLayout>;
  }

  return (
    <AppLayout>
      <main className="mx-auto max-w-[1400px] space-y-6">
        <header className="space-y-4">
          <Link href="/workouts" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-200"><ArrowLeft className="h-4 w-4" /> Workouts</Link>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${isDraft ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-800 text-zinc-400"}`}>{isDraft ? "In progress" : "Completed"}</span>
                <span className="text-xs uppercase tracking-[0.16em] text-zinc-600">{workout.workout_type.replace("_", " ")}</span>
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">{workout.title}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500"><CalendarDays className="h-4 w-4" /> {formatWorkoutDate(workout.date)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isDraft ? <Button onClick={() => setFinishOpen(true)} disabled={workout.total_sets === 0} className="bg-emerald-400 font-semibold text-zinc-950 hover:bg-emerald-300"><Check className="h-4 w-4" /> Finish workout</Button> : null}
              <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:text-red-300" onClick={() => void removeWorkout()} disabled={deleteWorkout.isPending}><Trash2 className="h-4 w-4" /> {isDraft ? "Discard" : "Delete"}</Button>
            </div>
          </div>
        </header>

        {justCompleted ? <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] p-4"><span className="mt-0.5 rounded-full bg-emerald-400 p-1 text-zinc-950"><Check className="h-4 w-4" /></span><div><p className="font-semibold text-zinc-100">Workout complete</p><p className="mt-0.5 text-sm text-zinc-400">This session now contributes to your history and progress.</p></div></div> : null}
        {error ? <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}
        <p className="sr-only" aria-live="polite">{saveMessage}</p>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="space-y-5" aria-label="Workout logger">
            <Card className="border-zinc-800 bg-zinc-900/35 p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div><p className="text-xs text-zinc-600">Exercises</p><p className="mt-1 text-lg font-semibold text-zinc-100">{workout.exercise_count}</p></div>
                <div><p className="text-xs text-zinc-600">Sets</p><p className="mt-1 text-lg font-semibold text-zinc-100">{workout.total_sets}</p></div>
                <div><p className="text-xs text-zinc-600">Volume</p><p className="mt-1 text-lg font-semibold text-zinc-100">{formatVolume(workout.total_volume)} <span className="text-xs font-normal text-zinc-600">kg</span></p></div>
                <div><p className="text-xs text-zinc-600">Duration</p><p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-zinc-100"><Clock3 className="h-4 w-4 text-zinc-600" />{workout.duration_minutes} <span className="text-xs font-normal text-zinc-600">min</span></p></div>
              </div>
            </Card>

            {groups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-10 text-center"><Dumbbell className="mx-auto h-7 w-7 text-zinc-700" /><h2 className="mt-3 font-semibold text-zinc-200">No sets yet</h2><p className="mt-1 text-sm text-zinc-500">Choose an exercise below and log your first working set.</p></div>
            ) : groups.map((group) => (
              <Card key={group.exerciseId} className="overflow-hidden border-zinc-800 bg-zinc-900/35">
                <button type="button" onClick={() => selectExercise(String(group.exerciseId))} className="flex w-full items-center justify-between border-b border-zinc-800 px-4 py-3 text-left transition hover:bg-zinc-800/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40"><div><h2 className="font-semibold text-zinc-100">{group.exerciseName}</h2><p className="mt-0.5 text-xs capitalize text-zinc-600">{group.muscleGroup.replace("_", " ")}</p></div><span className="text-xs text-zinc-500">{group.sets.length} {group.sets.length === 1 ? "set" : "sets"}</span></button>
                <div className="divide-y divide-zinc-800/70">
                  <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2rem] items-center gap-2 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600"><span>Set</span><span>kg</span><span>Reps</span><span className="sr-only">Action</span></div>
                  {group.sets.map((set) => (
                    <div key={set.id} className="px-4 py-3">
                      <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2rem] items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-500">{set.set_number}</span>
                        <Input aria-label={`${group.exerciseName} set ${set.set_number} weight`} type="number" min={0} max={2000} step="0.5" defaultValue={set.weight} disabled={!isDraft} onBlur={(event) => void editSet(set, "weight", event.target.value)} className="h-9 border-zinc-800 bg-zinc-950" />
                        <Input aria-label={`${group.exerciseName} set ${set.set_number} reps`} type="number" min={1} max={1000} step="1" defaultValue={set.reps} disabled={!isDraft} onBlur={(event) => void editSet(set, "reps", event.target.value)} className="h-9 border-zinc-800 bg-zinc-950" />
                        {isDraft ? <button type="button" aria-label={`Delete ${group.exerciseName} set ${set.set_number}`} onClick={() => void removeSet(set.id)} className="rounded-md p-2 text-zinc-600 transition hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><Trash2 className="h-4 w-4" /></button> : <Check className="h-4 w-4 text-zinc-700" aria-hidden="true" />}
                      </div>
                      {set.rpe !== null || set.rir !== null || set.notes ? <p className="mt-2 pl-10 text-xs text-zinc-600">{set.rpe !== null ? `RPE ${set.rpe}` : ""}{set.rpe !== null && set.rir !== null ? " · " : ""}{set.rir !== null ? `${set.rir} RIR` : ""}{(set.rpe !== null || set.rir !== null) && set.notes ? " · " : ""}{set.notes}</p> : null}
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {isDraft ? (
              <Card className="border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-semibold text-zinc-100">Log a set</h2><p className="mt-1 text-xs text-zinc-500">Weight and reps stay ready for the next set.</p></div>{saveMessage ? <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><Check className="h-3.5 w-3.5" /> {saveMessage}</span> : null}</div>
                <form onSubmit={addSet} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3"><label htmlFor="exercise-select" className="text-sm font-medium text-zinc-300">Exercise</label><button type="button" onClick={() => setShowCustomExercise((current) => !current)} className="text-xs font-medium text-emerald-400 hover:text-emerald-300">{showCustomExercise ? "Choose existing" : "Create custom"}</button></div>
                    {showCustomExercise ? (
                      <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                        <Input aria-label="Custom exercise name" maxLength={140} placeholder="Exercise name" value={customName} onChange={(event) => setCustomName(event.target.value)} className="border-zinc-800 bg-zinc-900" />
                        <select aria-label="Custom exercise muscle group" value={customMuscle} onChange={(event) => setCustomMuscle(event.target.value)} className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40">
                          {Object.entries({ chest: "Chest", back: "Back", shoulders: "Shoulders", biceps: "Biceps", triceps: "Triceps", forearms: "Forearms", abs: "Core", quads: "Quads", hamstrings: "Hamstrings", glutes: "Glutes", calves: "Calves", full_body: "Full body" }).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <Button type="button" variant="outline" className="w-full border-zinc-700" onClick={() => void createCustomExercise()} disabled={createExercise.isPending}>{createExercise.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add to library</Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" /><Input type="search" aria-label="Search exercise library" placeholder="Search the exercise library" value={exerciseSearch} onChange={(event) => setExerciseSearch(event.target.value)} className="border-zinc-800 bg-zinc-950 pl-9" /></div>
                        <select id="exercise-select" value={selectedExercise} onChange={(event) => selectExercise(event.target.value)} className="h-11 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"><option value="">Select an exercise</option>{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name} · {exercise.muscle_group.replace("_", " ")}</option>)}</select>
                        {exercisesQuery.isFetching ? <p className="text-xs text-zinc-600">Searching…</p> : null}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><label htmlFor="set-weight" className="text-sm font-medium text-zinc-300">Weight <span className="text-zinc-600">kg</span></label><Input id="set-weight" type="number" inputMode="decimal" min={0} max={2000} step="0.5" placeholder="80" value={weight} onChange={(event) => setWeight(event.target.value)} className="h-12 border-zinc-800 bg-zinc-950 text-lg font-semibold" /></div>
                    <div className="space-y-1.5"><label htmlFor="set-reps" className="text-sm font-medium text-zinc-300">Reps</label><Input id="set-reps" type="number" inputMode="numeric" min={1} max={1000} step="1" placeholder="8" value={reps} onChange={(event) => setReps(event.target.value)} className="h-12 border-zinc-800 bg-zinc-950 text-lg font-semibold" /></div>
                  </div>

                  <details className="group rounded-xl border border-zinc-800 bg-zinc-950/50">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-medium text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40">Advanced <ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
                    <div className="grid gap-3 border-t border-zinc-800 p-3 sm:grid-cols-2">
                      <div className="space-y-1.5"><label htmlFor="set-rpe" className="text-xs text-zinc-500">RPE · 1–10</label><Input id="set-rpe" type="number" min={1} max={10} step="0.5" placeholder="8.5" value={rpe} onChange={(event) => setRpe(event.target.value)} className="border-zinc-800 bg-zinc-900" /></div>
                      <div className="space-y-1.5"><label htmlFor="set-rir" className="text-xs text-zinc-500">Reps in reserve · 0–10</label><Input id="set-rir" type="number" min={0} max={10} step="1" placeholder="2" value={rir} onChange={(event) => setRir(event.target.value)} className="border-zinc-800 bg-zinc-900" /></div>
                      <div className="space-y-1.5 sm:col-span-2"><label htmlFor="set-note" className="text-xs text-zinc-500">Set note</label><Input id="set-note" maxLength={500} placeholder="Tempo, setup, or cue" value={setNote} onChange={(event) => setSetNote(event.target.value)} className="border-zinc-800 bg-zinc-900" /></div>
                    </div>
                  </details>

                  <Button type="submit" disabled={createSet.isPending || !selectedExercise || weight === "" || reps === ""} className="h-11 w-full bg-emerald-400 font-semibold text-zinc-950 hover:bg-emerald-300">{createSet.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Plus className="h-4 w-4" /> Add set</>}</Button>
                </form>
              </Card>
            ) : <Card className="border-zinc-800 bg-zinc-900/30 p-5"><p className="font-medium text-zinc-200">Workout locked</p><p className="mt-1 text-sm text-zinc-500">Completed sets stay unchanged so progress data remains trustworthy.</p></Card>}
          </section>

          <AnatomyMuscleMap muscleGroup={activeMuscle} exerciseName={activeExerciseName} />
        </div>

        <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
          <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 text-zinc-100">
            <DialogHeader><DialogTitle>Finish {workout.title}?</DialogTitle><DialogDescription className="text-zinc-400">Review the session before adding it to your history and progress.</DialogDescription></DialogHeader>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div><p className="text-xs text-zinc-600">Exercises</p><p className="mt-1 font-semibold text-zinc-100">{workout.exercise_count}</p></div><div><p className="text-xs text-zinc-600">Sets</p><p className="mt-1 font-semibold text-zinc-100">{workout.total_sets}</p></div><div><p className="text-xs text-zinc-600">Volume</p><p className="mt-1 font-semibold text-zinc-100">{formatVolume(workout.total_volume)} kg</p></div><div><p className="text-xs text-zinc-600">Duration</p><p className="mt-1 font-semibold text-zinc-100">{workout.duration_minutes} min</p></div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" className="border-zinc-700" onClick={() => setFinishOpen(false)} disabled={completeWorkout.isPending}>Keep logging</Button><Button className="bg-emerald-400 font-semibold text-zinc-950 hover:bg-emerald-300" onClick={() => void finishWorkout()} disabled={completeWorkout.isPending}>{completeWorkout.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Finishing…</> : <><Check className="h-4 w-4" /> Finish workout</>}</Button></div>
          </DialogContent>
        </Dialog>
      </main>
    </AppLayout>
  );
}
