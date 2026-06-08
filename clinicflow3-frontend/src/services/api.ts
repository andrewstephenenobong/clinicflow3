const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

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
  register: (clinicName: string, adminName: string, email: string, password: string) =>
    request<{ user: ApiUser; clinic: ApiClinic }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ clinicName, adminName, adminEmail: email, adminPassword: password }),
    }),

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

// ── Queue ──
export const queueApi = {
  getToday: () =>
    request<{ visits: ApiVisit[] }>("/api/queue/today"),

  checkIn: (patientId: string, reason: string, triage: string) =>
    request<{ visit: ApiVisit }>("/api/queue/checkin", {
      method: "POST",
      body: JSON.stringify({ patientId, reason, triage }),
    }),

  call: (visitId: string) =>
    request<{ visit: ApiVisit }>(`/api/queue/${visitId}/call`, {
      method: "PATCH",
    }),

  markSeen: (visitId: string, notes?: string) =>
    request<{ visit: ApiVisit }>(`/api/queue/${visitId}/seen`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    }),
};

// ── Beds ──
export const bedApi = {
  getAll: () =>
    request<{ beds: ApiBed[] }>("/api/beds"),

  update: (bedId: string, status: string, patientId?: string) =>
    request<{ bed: ApiBed }>(`/api/beds/${bedId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, patientId }),
    }),
};

// ── Patients ──
export const patientApi = {
  getAll: () =>
    request<{ patients: ApiPatient[] }>("/api/patients"),

  getOne: (patientId: string) =>
    request<{ patient: ApiPatient & { visits: ApiVisit[] } }>(`/api/patients/${patientId}`),

  create: (name: string, age: number, gender: string, phone?: string) =>
    request<{ patient: ApiPatient }>("/api/patients", {
      method: "POST",
      body: JSON.stringify({ name, age, gender, phone }),
    }),
};
// ── Staff ──
export const staffApi = {
  getAll: () =>
    request<{ staff: ApiStaff[] }>("/api/staff"),

  create: (name: string, email: string, password: string, role: string) =>
    request<{ user: ApiStaff }>("/api/staff", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    }),

  remove: (staffId: string) =>
    request<{ message: string }>(`/api/staff/${staffId}`, {
      method: "DELETE",
    }),
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

export interface ApiPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string | null;
}

export interface ApiVisit {
  id: string;
  patientId: string;
  clinicId: string;
  reason: string;
  triage: "EMERGENCY" | "URGENT" | "ROUTINE";
  status: "WAITING" | "CALLED" | "SEEN";
  notes: string | null;
  checkedInAt: string;
  calledAt: string | null;
  seenAt: string | null;
  patient: ApiPatient;
}

export interface ApiBed {
  id: string;
  clinicId: string;
  bedNumber: string;
  ward: string;
  status: "AVAILABLE" | "OCCUPIED";
  patientId: string | null;
  patient: { id: string; name: string } | null;
}

export interface ApiStaff {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}