"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSession, clearSession, type AuthUser } from "@/lib/auth/simpleAuth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { AuthUser };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const update = () => setUser(getSession());
    update();
    setLoading(false);
    window.addEventListener("storage", update);
    window.addEventListener("futures-auth-change", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("futures-auth-change", update);
    };
  }, []);

  const logout = async () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
