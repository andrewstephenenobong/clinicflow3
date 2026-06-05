import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useAuth } from "../../context/AuthContext";
import type { Clinic, Visit } from "../../types";

// Bed type defined here now that mockBeds.ts is deleted
export interface Bed {
  id: string;
  bedNumber: string;
  ward: string;
  status: "AVAILABLE" | "OCCUPIED";
  patientName?: string;
  patientId?: string;
}

// What every page gets when it calls useOutletContext<ClinicContext>()
export interface ClinicContext {
  visits: Visit[];
  setVisits: React.Dispatch<React.SetStateAction<Visit[]>>;
  beds: Bed[];
  addBed: (bed: Omit<Bed, "id">) => void;
  updateBed: (id: string, patch: Partial<Bed>) => void;
  removeBed: (id: string) => void;
  toggleBedStatus: (id: string) => void;
  clinic: Clinic;
  updateClinic: (patch: Partial<Clinic>) => void;
}

export function AppShell() {
  const { currentClinic } = useAuth();

  const clinic: Clinic = {
    id: currentClinic?.id ?? "",
    name: currentClinic?.name ?? "Loading...",
    address: "",
    phone: "",
    email: "",
  };

  const [clinicOverride, setClinicOverride] = useState<Partial<Clinic>>({});
  const [visits, setVisits] = useState<Visit[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);

  const mergedClinic: Clinic = { ...clinic, ...clinicOverride };

  const addBed = (bed: Omit<Bed, "id">) => {
    const newBed: Bed = { ...bed, id: `b${Date.now()}` };
    setBeds((current) => [...current, newBed]);
  };

  const updateBed = (id: string, patch: Partial<Bed>) => {
    setBeds((current) =>
      current.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  };

  const removeBed = (id: string) => {
    setBeds((current) => current.filter((b) => b.id !== id));
  };

  const toggleBedStatus = (id: string) => {
    setBeds((current) =>
      current.map((b) => {
        if (b.id !== id) return b;
        if (b.status === "AVAILABLE") {
          return { ...b, status: "OCCUPIED", patientName: "New patient", patientId: `p${Date.now()}` };
        }
        return { ...b, status: "AVAILABLE", patientName: undefined, patientId: undefined };
      })
    );
  };

  const updateClinic = (patch: Partial<Clinic>) => {
    setClinicOverride((current) => ({ ...current, ...patch }));
  };

  const ctx: ClinicContext = {
    visits, setVisits,
    beds, addBed, updateBed, removeBed, toggleBedStatus,
    clinic: mergedClinic, updateClinic,
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar clinic={mergedClinic} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet context={ctx} />
        </main>
      </div>
    </div>
  );
}
