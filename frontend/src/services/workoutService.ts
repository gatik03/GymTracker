import { api } from "@/lib/api";

export async function createWorkout(
  data: {
    date: string;
    notes: string;
  }
) {
  const response = await api.post(
    "/workout-sessions/",
    data
  );

  return response.data;
}
