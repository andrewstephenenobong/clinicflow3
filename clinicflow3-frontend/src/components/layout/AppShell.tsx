import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useAuth } from "../../context/AuthContext";
import { queueApi, bedApi } from "../../services/api";
import type { ApiVisit, ApiBed } from "../../services/api";
import type { Clinic, Visit } from "../../types";

export interface Bed {
  id: string;
  bedNumber: string;
  ward: string;
  status: "AVAILABLE" | "OCCUPIED";
  patientName?: string;
  patientId?: string;
}

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
  isLoadingQueue: boolean;
  isLoadingBeds: boolean;
}

// Map API visit to frontend Visit type
function mapVisit(v: ApiVisit): Visit {
  return {
    id: v.id,
    patient: {
      id: v.patient.id,
      name: v.patient.name,
      age: v.patient.age,
      gender: v.patient.gender as "M" | "F",
      phone: v.patient.phone ?? "",
    },
    reason: v.reason,
    triage: v.triage,
    status: v.status,
    checkedInAt: v.checkedInAt,
  };
}

// Map API bed to frontend Bed type
function mapBed(b: ApiBed): Bed {
  return {
    id: b.id,
    bedNumber: b.bedNumber,
    ward: b.ward,
    status: b.status,
    patientName: b.patient?.name,
    patientId: b.patientId ?? undefined,
  };
}

export function AppShell() {
  const { currentClinic } = useAuth();
  const [clinicOverride, setClinicOverride] = useState<Partial<Clinic>>({});

  const clinic: Clinic = {
    id: currentClinic?.id ?? "",
    name: currentClinic?.name ?? "Loading...",
    address: "",
    phone: "",
    email: "",
  };

  const mergedClinic: Clinic = { ...clinic, ...clinicOverride };

  // Fetch today's queue from real API
  const { data: queueData, isLoading: isLoadingQueue } = useQuery({
    queryKey: ["queue", "today"],
    queryFn: () => queueApi.getToday(),
  });

  // Fetch beds from real API
  const { data: bedsData, isLoading: isLoadingBeds } = useQuery({
    queryKey: ["beds"],
    queryFn: () => bedApi.getAll(),
  });

  const visits: Visit[] = (queueData?.visits ?? []).map(mapVisit);
  const beds: Bed[] = (bedsData?.beds ?? []).map(mapBed);

  // These remain local for now — full CRUD via API comes next session
  const [localBeds, setLocalBeds] = useState<Bed[]>([]);
  const allBeds = beds.length > 0 ? beds : localBeds;

  const addBed = (bed: Omit<Bed, "id">) => {
    const newBed: Bed = { ...bed, id: `b${Date.now()}` };
    setLocalBeds((current) => [...current, newBed]);
  };

  const updateBed = (id: string, patch: Partial<Bed>) => {
    setLocalBeds((current) =>
      current.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  };

  const removeBed = (id: string) => {
    setLocalBeds((current) => current.filter((b) => b.id !== id));
  };

  const toggleBedStatus = (id: string) => {
    setLocalBeds((current) =>
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

  // visits state + setVisits kept for compatibility with QueuePage actions
  const [localVisits, setLocalVisits] = useState<Visit[]>([]);
  const allVisits = visits.length > 0 ? visits : localVisits;

  const ctx: ClinicContext = {
    visits: allVisits,
    setVisits: setLocalVisits,
    beds: allBeds,
    addBed, updateBed, removeBed, toggleBedStatus,
    clinic: mergedClinic, updateClinic,
    isLoadingQueue,
    isLoadingBeds,
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
