export type Triage = "EMERGENCY" | "URGENT" | "ROUTINE";

export type VisitStatus = "WAITING" | "CALLED" | "SEEN";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F";
  phone: string;
}

export interface Visit {
  id: string;
  patient: Patient;
  reason: string;
  triage: Triage;
  status: VisitStatus;
  checkedInAt: string;
  isCarriedOver?: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export type Role = "ADMIN" | "DOCTOR" | "RECEPTIONIST";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  clinicId: string;
}
