// Base URL — in development this points to our local backend
// In production this will be the Render URL via an environment variable
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// All fetch calls go through this helper.
// credentials: "include" is critical — it tells the browser to send
// the httpOnly cookie on every request (D5)
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

// ── Auth ──
export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: ApiUser; clinic: ApiClinic }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () =>
    request<{ user: ApiUser; clinic: ApiClinic }>("/api/auth/me"),

  logout: () =>
    request<{ message: string }>("/api/auth/logout", { method: "POST" }),
};

// ── Shared API response types ──
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  clinicId: string;
}

export interface ApiClinic {
  id: string;
  name: string;
}
