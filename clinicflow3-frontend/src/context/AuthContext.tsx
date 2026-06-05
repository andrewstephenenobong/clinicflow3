import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import { authApi } from "../services/api";

interface AuthContextType {
  currentUser: User | null;
  currentClinic: { id: string; name: string } | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentClinic, setCurrentClinic] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, call GET /api/auth/me to rehydrate session from httpOnly cookie.
  // If the cookie is valid, we get the user back and stay logged in.
  // If not, we get a 401 and stay on the login page.
  // This replaces the old localStorage read.
  useEffect(() => {
    authApi.me()
      .then(({ user, clinic }) => {
        setCurrentUser({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as User["role"],
          clinicId: user.clinicId,
        });
        setCurrentClinic(clinic);
      })
      .catch(() => {
        // No valid session — stay logged out, that's fine
        setCurrentUser(null);
        setCurrentClinic(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Calls POST /api/auth/login — backend sets the httpOnly cookie
  async function login(email: string, password: string) {
    const { user, clinic } = await authApi.login(email, password);
    setCurrentUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as User["role"],
      clinicId: user.clinicId,
    });
    setCurrentClinic(clinic);
  }

  // Calls POST /api/auth/logout — backend clears the httpOnly cookie
  async function logout() {
    await authApi.logout().catch(() => {});
    setCurrentUser(null);
    setCurrentClinic(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, currentClinic, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
