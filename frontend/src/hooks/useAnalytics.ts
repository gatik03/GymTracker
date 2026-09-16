import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useTotalVolume() {
  return useQuery<{ total_volume: number }>({
    queryKey: ["analytics", "total-volume"],
    queryFn: async () => {
      const response = await api.get("/analytics/total-volume/");
      return response.data;
    },
  });
}

export function useVolumePerExercise() {
  return useQuery<{ exercise_id: number; exercise_name: string; total_volume: number }[]>({
    queryKey: ["analytics", "volume-per-exercise"],
    queryFn: async () => {
      const response = await api.get("/analytics/volume-per-exercise/");
      return response.data;
    },
  });
}

export function useVolumePerMuscleGroup() {
  return useQuery<{ muscle_group: string; total_volume: number }[]>({
    queryKey: ["analytics", "volume-per-muscle-group"],
    queryFn: async () => {
      const response = await api.get("/analytics/volume-per-muscle-group/");
      return response.data;
    },
  });
}

export function useWeeklyVolume() {
  return useQuery<{ week: string; total_volume: number }[]>({
    queryKey: ["analytics", "weekly-volume"],
    queryFn: async () => {
      const response = await api.get("/analytics/weekly-volume/");
      return response.data;
    },
  });
}

export function useDailyVolume(month?: string) {
  return useQuery<{ date: string; total_volume: number }[]>({
    queryKey: ["analytics", "daily-volume", month],
    queryFn: async () => {
      const response = await api.get("/analytics/daily-volume/", {
        params: { month: month || undefined },
      });
      return response.data;
    },
  });
}

export function useMonthlyVolume() {
  return useQuery<{ month: string; total_volume: number }[]>({
    queryKey: ["analytics", "monthly-volume"],
    queryFn: async () => {
      const response = await api.get("/analytics/monthly-volume/");
      return response.data;
    },
  });
}

export function useExerciseProgress(exerciseId: number) {
  return useQuery<{ date: string; max_weight: number; total_volume: number; estimated_1rm: number }[]>({
    queryKey: ["analytics", "exercise-progress", exerciseId],
    queryFn: async () => {
      const response = await api.get(`/analytics/exercise-progress/${exerciseId}/`);
      return response.data;
    },
    enabled: !!exerciseId,
  });
}

export function useEstimated1RM(exerciseId: number) {
  return useQuery<{ date: string; estimated_1rm: number }[]>({
    queryKey: ["analytics", "estimated-1rm", exerciseId],
    queryFn: async () => {
      const response = await api.get(`/analytics/estimated-1rm/${exerciseId}/`);
      return response.data;
    },
    enabled: !!exerciseId,
  });
}

export interface PersonalRecord {
  exercise_id: number;
  exercise_name: string;
  muscle_group: string;
  max_weight: number;
  max_weight_date: string;
  max_estimated_1rm: number;
  max_estimated_1rm_date: string;
}

export function usePersonalRecords() {
  return useQuery<PersonalRecord[]>({
    queryKey: ["analytics", "prs"],
    queryFn: async () => {
      const response = await api.get("/analytics/prs/");
      return response.data;
    },
  });
}
