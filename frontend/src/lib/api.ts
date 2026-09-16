import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface FailedRequest {
  resolve: () => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error?: unknown) => {
  failedQueue.forEach((request) => {
    if (error) request.reject(error);
    else request.resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;
    if (!originalRequest) return Promise.reject(error);

    const isAuthEndpoint = originalRequest.url?.includes("/auth/login/")
      || originalRequest.url?.includes("/auth/refresh/")
      || originalRequest.url?.includes("/auth/csrf/");
    if (isAuthEndpoint || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post("/auth/refresh/");
      processQueue();
      return api(originalRequest);
    } catch (refreshError: unknown) {
      processQueue(refreshError);
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.replace("/login?session=expired");
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
