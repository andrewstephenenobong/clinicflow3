import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";

// --- Shape of what AuthContext provides to the whole app ---
interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

// --- Create the context with a safe default ---
const AuthContext = createContext<AuthContextType | null>(null);

// --- Provider: wraps the whole app, holds the auth state ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, check if a user was previously saved in localStorage
  // TEMPORARY — Session 2 replaces this with a real GET /api/auth/me call
  useEffect(() => {
    const stored = localStorage.getItem("clinicflow_user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("clinicflow_user");
      }
    }
    setIsLoading(false);
  }, []);

  // Called after a successful login
  // TEMPORARY — Session 2 replaces localStorage with real JWT httpOnly cookie
  function login(user: User) {
    localStorage.setItem("clinicflow_user", JSON.stringify(user));
    setCurrentUser(user);
  }

  // Called when user logs out
  function logout() {
    localStorage.removeItem("clinicflow_user");
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Hook: any component calls useAuth() to get auth state ---
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
