import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ListOrdered,
  Users,
  BedDouble,
  AlertTriangle,
  Settings,
  ClipboardList,
  MessageSquare,
  Stethoscope,
  FileText,
  HelpCircle,
  MoreHorizontal,
  X,
  LogOut,
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

// The 4 tabs people reach for constantly, kept one tap away.
// Everything else (Dashboard for admins, Admitted, Chat, Portal, Consent,
// Support, Settings) lives behind "More" so the bar doesn't get crowded.
const PRIMARY_NAV_ITEMS: BottomNavItem[] = [
  { to: "/queue",     label: "Queue",    Icon: ListOrdered   },
  { to: "/patients",  label: "Patients", Icon: Users         },
  { to: "/beds",       label: "Beds",     Icon: BedDouble     },
  { to: "/emergency", label: "SOS",      Icon: AlertTriangle },
];

function useMoreNavItems() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";

  const items: BottomNavItem[] = [
    ...(isAdmin ? [{ to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard }] : []),
    { to: "/admitted", label: "Admitted",             Icon: ClipboardList },
    { to: "/chat",     label: "Doctor–Patient Chat",  Icon: MessageSquare },
    { to: "/portal",   label: "Patient Portal",       Icon: Stethoscope   },
    { to: "/consent",  label: "Consent Forms",        Icon: FileText      },
    { to: "/support",  label: "Help & Support",       Icon: HelpCircle    },
    { to: "/settings", label: "Settings",             Icon: Settings      },
  ];

  return items;
}

function MoreSheet({ onClose }: { onClose: () => void }) {
  const items = useMoreNavItems();
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    onClose();
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 z-50 flex items-end animate-fade-in md:hidden"
      onClick={onClose}
    >
      <div
        className="bg-white w-full rounded-t-2xl shadow-xl pb-[env(safe-area-inset-bottom)] animate-slide-up max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="mx-auto w-10 h-1 rounded-full bg-slate-200 absolute left-1/2 -translate-x-1/2 top-2" />
          <h2 className="text-sm font-semibold text-slate-700">More</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 transition-transform hover:scale-110 hover:rotate-90 duration-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 p-5">
          {items.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={{ animationDelay: `${i * 30}ms` }}
              className={({ isActive }) =>
                `animate-slide-up flex flex-col items-center justify-center gap-1.5 rounded-xl border py-4 px-2 text-center transition-all duration-150 active:scale-95 ${
                  isActive
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`
              }
            >
              <item.Icon size={20} />
              <span className="text-[11px] font-medium leading-tight">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-5 py-4 border-t border-slate-100 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );
}

function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreItems = useMoreNavItems();

  // Highlight "More" itself when the active route lives inside it, so the
  // person can tell where they are even though that page isn't a primary tab.
  const isInsideMore = moreItems.some((item) => location.pathname.startsWith(item.to));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 md:hidden">
        <div className="flex">
          {PRIMARY_NAV_ITEMS.map((item) => (
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

          <button
            onClick={() => setMoreOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-all duration-150 active:scale-90 ${
              isInsideMore ? "text-blue-600 -translate-y-0.5" : "text-slate-500"
            }`}
          >
            <MoreHorizontal size={18} className="mb-0.5 transition-transform duration-150" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} />}
    </>
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
