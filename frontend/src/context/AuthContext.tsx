"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthUser,
  ensureCsrfCookie,
  getSession,
  login as apiLogin,
  logout as apiLogout,
} from "@/services/auth/authService";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string, destination?: string) => Promise<void>;
  logout: () => Promise<void>;
  completeAuthentication: (user: AuthUser, destination?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const safeDestinations = new Set(["/", "/workouts", "/analytics", "/journal", "/profile"]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await ensureCsrfCookie();
        const sessionUser = await getSession();
        if (active) setUser(sessionUser);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const completeAuthentication = (authenticatedUser: AuthUser, destination = "/") => {
    setUser(authenticatedUser);
    router.replace(safeDestinations.has(destination) ? destination : "/");
  };

  const login = async (identifier: string, password: string, destination = "/") => {
    setIsLoading(true);
    try {
      const authenticatedUser = await apiLogin(identifier, password);
      completeAuthentication(authenticatedUser, destination);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, isLoading, login, logout, completeAuthentication }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
