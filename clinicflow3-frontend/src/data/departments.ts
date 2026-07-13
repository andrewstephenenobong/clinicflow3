// Frontend-only department taxonomy for staff profiles.
//
// The backend `Role` enum currently only supports ADMIN, DOCTOR,
// RECEPTIONIST, and SECURITY_OFFICER (see prisma/schema.prisma). The wider
// department list below is UI-only grouping/display metadata layered on top
// of the existing role — it is not sent to the API. Each department maps to
// the closest existing backend role so new staff can still be created
// through the real endpoint.
//
// TODO(backend): extend the Role enum (or add a separate `department` column)
// to persist the full department list below instead of approximating it.
export type Department =
  | "Doctor"
  | "Nurse"
  | "Reception"
  | "Pharmacy"
  | "Laboratory"
  | "Radiology"
  | "IT"
  | "Accountant"
  | "Customer Care"
  | "Maintenance"
  | "Sanitation"
  | "Security"
  | "Administration"
  | "Utility";

export const DEPARTMENTS: Department[] = [
  "Doctor",
  "Nurse",
  "Reception",
  "Pharmacy",
  "Laboratory",
  "Radiology",
  "IT",
  "Accountant",
  "Customer Care",
  "Maintenance",
  "Sanitation",
  "Security",
  "Administration",
  "Utility",
];

// Nearest supported backend role for a given department, used only when
// submitting the "Add staff" form.
export const DEPARTMENT_TO_ROLE: Record<Department, string> = {
  Doctor: "DOCTOR",
  Nurse: "DOCTOR",
  Reception: "RECEPTIONIST",
  Pharmacy: "RECEPTIONIST",
  Laboratory: "RECEPTIONIST",
  Radiology: "RECEPTIONIST",
  IT: "ADMIN",
  Accountant: "ADMIN",
  "Customer Care": "RECEPTIONIST",
  Maintenance: "SECURITY_OFFICER",
  Sanitation: "SECURITY_OFFICER",
  Security: "SECURITY_OFFICER",
  Administration: "ADMIN",
  Utility: "SECURITY_OFFICER",
};

// Best-effort inverse mapping — used only to *display* a department for
// staff loaded from the API, which only carries `role`.
export const ROLE_TO_DEPARTMENT: Record<string, Department> = {
  ADMIN: "Administration",
  DOCTOR: "Doctor",
  RECEPTIONIST: "Reception",
  SECURITY_OFFICER: "Security",
};
