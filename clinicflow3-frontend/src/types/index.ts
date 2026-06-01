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
}
export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}
