import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import { authApi } from "../services/api";

interface AuthClinic {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  currentClinic: AuthClinic | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setClinic: (clinic: AuthClinic) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentClinic, setCurrentClinic] = useState<AuthClinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, call GET /api/auth/me to rehydrate session from httpOnly cookie.
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
        setCurrentClinic({
          id: clinic.id,
          name: clinic.name,
          address: clinic.address ?? "",
          phone: clinic.phone ?? "",
          email: clinic.email ?? "",
        });
      })
      .catch(() => {
        setCurrentUser(null);
        setCurrentClinic(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Calls POST /api/auth/login — backend sets the httpOnly cookie
  async function login(email: string, password: string) {
    const { user, clinic } = await authApi.login(email, password);
    const mappedUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as User["role"],
      clinicId: user.clinicId,
    };
    setCurrentUser(mappedUser);
    setCurrentClinic({
      id: clinic.id,
      name: clinic.name,
      address: clinic.address ?? "",
      phone: clinic.phone ?? "",
      email: clinic.email ?? "",
    });
    return mappedUser;
  }

  // Calls POST /api/auth/logout — backend clears the httpOnly cookie
  async function logout() {
    await authApi.logout().catch(() => {});
    setCurrentUser(null);
    setCurrentClinic(null);
  }

  // Lets other parts of the app (e.g. AppShell after a clinic-profile save)
  // push the updated clinic back into context so the header stays in sync.
  function setClinic(clinic: AuthClinic) {
    setCurrentClinic(clinic);
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, currentClinic, isLoading, login, logout, setClinic }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
