import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface ExerciseSet {
  id: number;
  workout_session: number;
  exercise: number;
  exercise_name: string;
  exercise_muscle_group: string;
  set_number: number;
  weight: number;
  reps: number;
  rpe: number | null;
  rir: number | null;
  notes: string;
  created_at: string;
}

export interface WorkoutSession {
  id: number;
  title: string;
  workout_type: string;
  date: string;
  notes: string | null;
  status: "draft" | "completed";
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  sets: ExerciseSet[];
  exercise_count: number;
  total_sets: number;
  total_volume: number;
  duration_minutes: number;
}

export function calculateWorkoutStreak(sessions: WorkoutSession[]): number {
  const trainingDates = new Set(sessions.map((session) => session.date));
  if (trainingDates.size === 0) return 0;

  const cursor = new Date();
  const localDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (!trainingDates.has(localDate(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (trainingDates.has(localDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function useWorkoutSessions() {
  return useQuery<WorkoutSession[]>({
    queryKey: ["workouts", "completed"],
    queryFn: async () => {
      const response = await api.get<WorkoutSession[]>("/workout-sessions/");
      return response.data;
    },
  });
}

export function useActiveWorkoutDraft() {
  return useQuery<WorkoutSession | null>({
    queryKey: ["workouts", "active-draft"],
    queryFn: async () => {
      const response = await api.get<WorkoutSession>("/workout-sessions/active-draft/");
      return response.status === 204 ? null : response.data;
    },
  });
}

export function useWorkoutSession(id: number) {
  return useQuery<WorkoutSession>({
    queryKey: ["workouts", id],
    queryFn: async () => {
      const response = await api.get<WorkoutSession>(`/workout-sessions/${id}/`);
      return response.data;
    },
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation<WorkoutSession, unknown, {
    title: string;
    workout_type: string;
    date: string;
    notes?: string;
  }>({
    mutationFn: async (data) => {
      const response = await api.post<WorkoutSession>("/workout-sessions/", data);
      return response.data;
    },
    onSuccess: (workout) => {
      queryClient.setQueryData(["workouts", workout.id], workout);
      queryClient.setQueryData(["workouts", "active-draft"], workout);
      queryClient.invalidateQueries({ queryKey: ["workouts", "completed"] });
    },
  });
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation<WorkoutSession, unknown, number>({
    mutationFn: async (id) => {
      const response = await api.post<WorkoutSession>(`/workout-sessions/${id}/complete/`);
      return response.data;
    },
    onSuccess: (workout) => {
      queryClient.setQueryData(["workouts", workout.id], workout);
      queryClient.setQueryData(["workouts", "active-draft"], null);
      queryClient.invalidateQueries({ queryKey: ["workouts", "completed"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["exercises", "recent"] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, number>({
    mutationFn: async (id) => {
      await api.delete(`/workout-sessions/${id}/`);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ["workouts", id] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
