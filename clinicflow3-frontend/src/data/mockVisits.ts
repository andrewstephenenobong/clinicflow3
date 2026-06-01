import type { Visit } from "../types";

export const mockVisits: Visit[] = [
  {
    id: "v1",
    patient: { id: "p1", name: "Adaeze Okafor", age: 34, gender: "F", phone: "+234 803 555 0101" },
    reason: "Severe abdominal pain",
    triage: "EMERGENCY",
    status: "WAITING",
    checkedInAt: "2026-06-01T08:42:00.000Z",
  },
  {
    id: "v2",
    patient: { id: "p2", name: "Ibrahim Suleiman", age: 58, gender: "M", phone: "+234 802 555 0102" },
    reason: "High blood pressure follow-up",
    triage: "URGENT",
    status: "WAITING",
    checkedInAt: "2026-06-01T08:55:00.000Z",
  },
  {
    id: "v3",
    patient: { id: "p3", name: "Chiamaka Eze", age: 27, gender: "F", phone: "+234 805 555 0103" },
    reason: "Routine antenatal check",
    triage: "ROUTINE",
    status: "WAITING",
    checkedInAt: "2026-06-01T09:10:00.000Z",
  },
  {
    id: "v4",
    patient: { id: "p4", name: "Tunde Bakare", age: 41, gender: "M", phone: "+234 806 555 0104" },
    reason: "Persistent cough, 2 weeks",
    triage: "URGENT",
    status: "WAITING",
    checkedInAt: "2026-06-01T09:18:00.000Z",
  },
  {
    id: "v5",
    patient: { id: "p5", name: "Ngozi Williams", age: 22, gender: "F", phone: "+234 807 555 0105" },
    reason: "Skin rash consultation",
    triage: "ROUTINE",
    status: "WAITING",
    checkedInAt: "2026-06-01T09:25:00.000Z",
  },
  {
    id: "v6",
    patient: { id: "p6", name: "Emeka Obi", age: 65, gender: "M", phone: "+234 808 555 0106" },
    reason: "Diabetic ulcer review",
    triage: "ROUTINE",
    status: "CALLED",
    checkedInAt: "2026-06-01T08:30:00.000Z",
  },
];
