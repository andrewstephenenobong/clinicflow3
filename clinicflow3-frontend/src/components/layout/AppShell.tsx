import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
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

// Bottom nav for mobile
function BottomNav() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";

  const items = [
    ...(isAdmin ? [{ to: "/dashboard", label: "Dashboard", icon: "📊" }] : []),
    { to: "/queue", label: "Queue", icon: "🏥" },
    { to: "/patients", label: "Patients", icon: "👥" },
    { to: "/beds", label: "Beds", icon: "🛏" },
    { to: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 md:hidden">
      <div className="flex">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors ${
                isActive ? "text-blue-600" : "text-slate-500"
              }`
            }
          >
            <span className="text-lg mb-0.5">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
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

  const { data: queueData, isLoading: isLoadingQueue } = useQuery({
    queryKey: ["queue", "today"],
    queryFn: () => queueApi.getToday(),
  });

  const { data: bedsData, isLoading: isLoadingBeds } = useQuery({
    queryKey: ["beds"],
    queryFn: () => bedApi.getAll(),
  });

  const visits: Visit[] = (queueData?.visits ?? []).map(mapVisit);
  const beds: Bed[] = (bedsData?.beds ?? []).map(mapBed);

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
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar clinic={mergedClinic} />
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
          <Outlet context={ctx} />
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
}
