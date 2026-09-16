import { api } from "@/lib/api";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  email_verified: boolean;
}

interface AuthResponse {
  user: AuthUser;
}

interface DetailResponse {
  detail: string;
}

export type OAuthProvider = "google" | "github";

export interface RegistrationInput {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
}

export interface PasswordResetInput {
  identifier: string;
  code: string;
  password: string;
  password_confirm: string;
}

export async function ensureCsrfCookie(): Promise<void> {
  await api.get("/auth/csrf/");
}

export async function login(identifier: string, password: string): Promise<AuthUser> {
  await ensureCsrfCookie();
  const response = await api.post<AuthResponse>("/auth/login/", {
    username: identifier,
    password,
  });
  return response.data.user;
}

export async function register(input: RegistrationInput): Promise<string> {
  await ensureCsrfCookie();
  const response = await api.post<DetailResponse>("/auth/register/", input);
  return response.data.detail;
}

export async function requestEmailVerification(identifier: string): Promise<string> {
  await ensureCsrfCookie();
  const response = await api.post<DetailResponse>("/auth/verify-email/request/", { identifier });
  return response.data.detail;
}

export async function confirmEmailVerification(identifier: string, code: string): Promise<AuthUser> {
  await ensureCsrfCookie();
  const response = await api.post<AuthResponse>("/auth/verify-email/confirm/", { identifier, code });
  return response.data.user;
}

export async function requestPasswordReset(identifier: string): Promise<string> {
  await ensureCsrfCookie();
  const response = await api.post<DetailResponse>("/auth/password-reset/request/", { identifier });
  return response.data.detail;
}

export async function confirmPasswordReset(input: PasswordResetInput): Promise<string> {
  await ensureCsrfCookie();
  const response = await api.post<DetailResponse>("/auth/password-reset/confirm/", input);
  return response.data.detail;
}

export async function startOAuth(provider: OAuthProvider, destination: string): Promise<void> {
  await ensureCsrfCookie();
  const response = await api.post<{ authorization_url: string }>(`/auth/oauth/${provider}/start/`, {
    next: destination,
  });
  const authorizationUrl = new URL(response.data.authorization_url);
  const allowedHosts: Record<OAuthProvider, string> = {
    google: "accounts.google.com",
    github: "github.com",
  };
  if (authorizationUrl.protocol !== "https:" || authorizationUrl.hostname !== allowedHosts[provider]) {
    throw new Error("The authentication provider returned an unsafe redirect.");
  }
  window.location.assign(authorizationUrl.toString());
}

export async function getOAuthConnections(): Promise<OAuthProvider[]> {
  const response = await api.get<{ providers: OAuthProvider[] }>("/auth/oauth/connections/");
  return response.data.providers;
}

export async function getSession(): Promise<AuthUser> {
  const response = await api.get<AuthResponse>("/auth/session/");
  return response.data.user;
}

export async function logout(): Promise<void> {
  await ensureCsrfCookie();
  await api.post("/auth/logout/");
}
