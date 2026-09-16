import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface JournalEntry {
  id: number;
  date: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface JournalDraft {
  date: string;
  title: string;
  content: string;
}

export function useJournalEntries() {
  return useQuery<JournalEntry[]>({
    queryKey: ["journal"],
    queryFn: async () => {
      const response = await api.get<JournalEntry[]>("/journal/");
      return response.data;
    },
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: JournalDraft) => {
      const response = await api.post<JournalEntry>("/journal/", draft);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal"] }),
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, draft }: { id: number; draft: JournalDraft }) => {
      const response = await api.patch<JournalEntry>(`/journal/${id}/`, draft);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal"] }),
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/journal/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["journal"] }),
  });
}
