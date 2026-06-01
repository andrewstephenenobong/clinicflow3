import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { mockVisits } from "../../data/mockVisits";
import { mockBeds, type Bed } from "../../data/mockBeds";
import type { Clinic, Visit } from "../../types";

// Default clinic profile — replaced by real data after backend lands.
const initialClinic: Clinic = {
  id: "c1",
  name: "Demo Clinic",
  address: "12 Awolowo Road, Ikoyi, Lagos",
  phone: "+234 803 000 0000",
  email: "info@democlinic.ng",
};

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
  const [visits, setVisits] = useState<Visit[]>(mockVisits);
  const [beds, setBeds] = useState<Bed[]>(mockBeds);
  const [clinic, setClinic] = useState<Clinic>(initialClinic);

  // Bed action helpers — single place to update, multiple call sites
  const addBed = (bed: Omit<Bed, "id">) => {
    const newBed: Bed = { ...bed, id: `b${Date.now()}` };
    setBeds((current) => [...current, newBed]);
  };

  const updateBed = (id: string, patch: Partial<Bed>) => {
    setBeds((current) => current.map((b) => (b.id === id ? { ...b, ...patch } : b)));
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
    setClinic((current) => ({ ...current, ...patch }));
  };

  const ctx: ClinicContext = {
    visits, setVisits,
    beds, addBed, updateBed, removeBed, toggleBedStatus,
    clinic, updateClinic,
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar clinic={clinic} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet context={ctx} />
        </main>
      </div>
    </div>
  );
}