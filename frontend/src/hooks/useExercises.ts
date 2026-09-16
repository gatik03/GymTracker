import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
  exercise_type: string;
  is_custom: boolean;
  created_by: number | null;
  created_at: string;
  is_favorite: boolean;
}

export interface ExerciseFilters {
  search?: string;
  muscleGroup?: string;
  equipment?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedExercises {
  count: number;
  next: string | null;
  previous: string | null;
  results: Exercise[];
}

export function useExercises(filters: ExerciseFilters = {}) {
  return useQuery<PaginatedExercises>({
    queryKey: ["exercises", filters],
    queryFn: async () => {
      const response = await api.get<PaginatedExercises>("/exercises/", {
        params: {
          search: filters.search || undefined,
          muscle_group: filters.muscleGroup || undefined,
          equipment: filters.equipment || undefined,
          page: filters.page ?? 1,
          page_size: filters.pageSize ?? 50,
        },
      });
      return response.data;
    },
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; muscle_group: string }) => {
      const response = await api.post<Exercise>("/exercises/custom/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
}

export function useCreateExerciseSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      workout_session: number;
      exercise: number;
      set_number: number;
      weight: number;
      reps: number;
      rpe?: number | null;
      rir?: number | null;
      notes?: string;
    }) => {
      const response = await api.post("/exercise-sets/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useUpdateExerciseSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        set_number?: number;
        weight?: number;
        reps?: number;
        rpe?: number | null;
        rir?: number | null;
        notes?: string;
      };
    }) => {
      const response = await api.patch(`/exercise-sets/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}

export function useDeleteExerciseSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/exercise-sets/${id}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}
