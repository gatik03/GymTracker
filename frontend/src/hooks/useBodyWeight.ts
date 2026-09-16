import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface BodyWeightEntry {
  id: number;
  weight: number;
  date: string;
  created_at?: string;
}

export function useBodyWeightLogs() {
  return useQuery<BodyWeightEntry[]>({
    queryKey: ["bodyweight", "logs"],
    queryFn: async () => {
      const response = await api.get("/bodyweight/");
      return response.data;
    },
  });
}

export function useCreateWeightLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { weight: number; date: string }) => {
      const response = await api.post("/bodyweight/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bodyweight"] });
    },
  });
}

export function useDeleteWeightLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/bodyweight/${id}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bodyweight"] });
    },
  });
}

export function useBodyWeightTrend() {
  return useQuery<{ id: number; weight: number; date: string }[]>({
    queryKey: ["bodyweight", "trend"],
    queryFn: async () => {
      const response = await api.get("/analytics/bodyweight/trend/");
      return response.data;
    },
  });
}

export interface BodyWeightRate {
  current_weight: number | null;
  starting_weight: number | null;
  total_change: number;
  rate_per_week: number;
  message: string;
}

export function useBodyWeightRate() {
  return useQuery<BodyWeightRate>({
    queryKey: ["bodyweight", "rate"],
    queryFn: async () => {
      const response = await api.get("/analytics/bodyweight/rate/");
      return response.data;
    },
  });
}
