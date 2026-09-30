import axios, { AxiosError } from "axios";

interface ApiErrorPayload {
  detail?: unknown;
  non_field_errors?: unknown;
  [field: string]: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const firstString = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstString(item);
      if (message) return message;
    }
  }
  return null;
};

const messageFromPayload = (payload: unknown): string | null => {
  if (!isRecord(payload)) return firstString(payload);

  const directMessage = firstString(payload.detail) ?? firstString(payload.non_field_errors);
  if (directMessage) return directMessage;

  for (const value of Object.values(payload)) {
    const fieldMessage = firstString(value);
    if (fieldMessage) return fieldMessage;
  }

  return null;
};

const isApiError = (error: unknown): error is AxiosError<ApiErrorPayload> => (
  axios.isAxiosError(error)
);

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    const apiMessage = messageFromPayload(error.response?.data);
    if (apiMessage) return apiMessage;

    if (error.code === "ERR_NETWORK") return "The server could not be reached. Please try again.";
    if (error.response?.status === 429) return "Too many attempts. Please wait and try again.";
  }

  // This covers deliberate, user-safe errors created by frontend services without
  // exposing arbitrary response bodies, stack traces, or transport internals.
  if (error instanceof Error && error.message === "The authentication provider returned an unsafe redirect.") {
    return error.message;
  }

  return fallback;
}
