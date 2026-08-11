import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ListOrdered,
  Users,
  BedDouble,
  AlertTriangle,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

interface BottomNavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
}

function BottomNav() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";

  const items: BottomNavItem[] = [
    ...(isAdmin ? [{ to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard }] : []),
    { to: "/queue",     label: "Queue",    Icon: ListOrdered  },
    { to: "/patients",  label: "Patients", Icon: Users        },
    { to: "/beds",      label: "Beds",     Icon: BedDouble    },
    { to: "/emergency", label: "SOS",      Icon: AlertTriangle },
    { to: "/settings",  label: "Settings", Icon: Settings     },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 md:hidden">
      <div className="flex">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-all duration-150 active:scale-90 ${
                isActive ? "text-blue-600 -translate-y-0.5" : "text-slate-500"
              }`
            }
          >
            <item.Icon size={18} className="mb-0.5 transition-transform duration-150" />
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
  const location = useLocation();

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

  const addBed = async (bed: Omit<Bed, "id">) => {
    await bedApi.create(bed.bedNumber, bed.ward);
    await invalidateBeds();
  };

  const updateBed = async (id: string, patch: { bedNumber?: string; ward?: string }) => {
    await bedApi.update(id, { bedNumber: patch.bedNumber, ward: patch.ward });
    await invalidateBeds();
  };

  const removeBed = async (id: string) => {
    await bedApi.remove(id);
    await invalidateBeds();
  };

  const assignBed = async (bedId: string, patientId: string, admissionNote?: string) => {
    await bedApi.assign(bedId, patientId, admissionNote);
    await invalidateBeds();
  };

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
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar clinic={clinic} />
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
          {/* Keying on the pathname re-triggers the fade/slide-up animation on every navigation */}
          <div key={location.pathname} className="animate-fade-in">
            <Outlet context={ctx} />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
