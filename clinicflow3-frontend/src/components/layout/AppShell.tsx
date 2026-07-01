import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useAuth } from "../../context/AuthContext";
import { queueApi, bedApi, clinicApi } from "../../services/api";
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
  addBed: (bed: Omit<Bed, "id">) => Promise<void>;
  updateBed: (id: string, patch: { bedNumber?: string; ward?: string }) => Promise<void>;
  removeBed: (id: string) => Promise<void>;
  assignBed: (bedId: string, patientId: string, admissionNote?: string) => Promise<void>;
  dischargeBed: (bedId: string, dischargeNote?: string) => Promise<void>;
  clinic: Clinic;
  updateClinic: (patch: Partial<Clinic>) => Promise<void>;
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
    isCarriedOver: v.isCarriedOver,
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
    { to: "/emergency", label: "SOS", icon: "🆘" },
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
  const { currentClinic, setClinic } = useAuth();
  const queryClient = useQueryClient();

  const clinic: Clinic = {
    id: currentClinic?.id ?? "",
    name: currentClinic?.name ?? "Loading...",
    address: currentClinic?.address ?? "",
    phone: currentClinic?.phone ?? "",
    email: currentClinic?.email ?? "",
  };

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

  const invalidateBeds = () =>
    queryClient.invalidateQueries({ queryKey: ["beds"] });

  // Create a bed on the server, then refetch the list.
  const addBed = async (bed: Omit<Bed, "id">) => {
    await bedApi.create(bed.bedNumber, bed.ward);
    await invalidateBeds();
  };

  // Edit a bed's number/ward (not admission — that goes through assign/discharge).
  const updateBed = async (id: string, patch: { bedNumber?: string; ward?: string }) => {
    await bedApi.update(id, { bedNumber: patch.bedNumber, ward: patch.ward });
    await invalidateBeds();
  };

  // Remove a bed on the server, then refetch.
  const removeBed = async (id: string) => {
    await bedApi.remove(id);
    await invalidateBeds();
  };

  // Admit a patient to a bed (opens an admission record server-side), then refetch.
  const assignBed = async (bedId: string, patientId: string, admissionNote?: string) => {
    await bedApi.assign(bedId, patientId, admissionNote);
    await invalidateBeds();
  };

  // Discharge a patient (closes the admission record server-side), then refetch.
  const dischargeBed = async (bedId: string, dischargeNote?: string) => {
    await bedApi.discharge(bedId, dischargeNote);
    await invalidateBeds();
  };

  const updateClinic = async (patch: Partial<Clinic>) => {
    const { clinic: saved } = await clinicApi.update({
      name: patch.name,
      address: patch.address,
      phone: patch.phone,
      email: patch.email,
    });
    setClinic({
      id: saved.id,
      name: saved.name,
      address: saved.address ?? "",
      phone: saved.phone ?? "",
      email: saved.email ?? "",
    });
  };

  const [localVisits, setLocalVisits] = useState<Visit[]>([]);
  const allVisits = visits.length > 0 ? visits : localVisits;

  const ctx: ClinicContext = {
    visits: allVisits,
    setVisits: setLocalVisits,
    beds,
    addBed, updateBed, removeBed, assignBed, dischargeBed,
    clinic, updateClinic,
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
        <TopBar clinic={clinic} />
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
          <Outlet context={ctx} />
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
}
