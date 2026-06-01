export interface Bed {
  id: string;
  bedNumber: string;
  ward: string;
  status: "AVAILABLE" | "OCCUPIED";
  patientName?: string;
  patientId?: string;
}

export const mockBeds: Bed[] = [
  { id: "b1", bedNumber: "A1", ward: "General", status: "OCCUPIED", patientName: "Emeka Obi", patientId: "p6" },
  { id: "b2", bedNumber: "A2", ward: "General", status: "AVAILABLE" },
  { id: "b3", bedNumber: "A3", ward: "General", status: "AVAILABLE" },
  { id: "b4", bedNumber: "A4", ward: "General", status: "OCCUPIED", patientName: "Yusuf Lawal", patientId: "p7" },
  { id: "b5", bedNumber: "B1", ward: "Maternity", status: "AVAILABLE" },
  { id: "b6", bedNumber: "B2", ward: "Maternity", status: "OCCUPIED", patientName: "Funke Ade", patientId: "p8" },
  { id: "b7", bedNumber: "B3", ward: "Maternity", status: "AVAILABLE" },
  { id: "b8", bedNumber: "C1", ward: "Emergency", status: "AVAILABLE" },
  { id: "c2", bedNumber: "C2", ward: "Emergency", status: "AVAILABLE" },
];
