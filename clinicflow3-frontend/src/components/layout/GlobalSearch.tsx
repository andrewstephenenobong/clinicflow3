import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, BedDouble, UserCog, ClipboardList, X } from "lucide-react";
import { patientApi, staffApi, bedApi } from "../../services/api";
import type { ApiPatient, ApiStaff, ApiBed, ApiAdmittedBed } from "../../services/api";

interface SearchGroup {
  label: string;
  Icon: typeof User;
  results: { id: string; primary: string; secondary: string; onSelect: () => void }[];
}

// Universal search — searches patients (name/phone/ID) via the existing
// search endpoint, plus beds and staff client-side (no list endpoint exists
// for a combined/admissions search yet).
// TODO(backend): once a unified /api/search endpoint exists, replace the
// three separate lookups below with a single call.
export function GlobalSearch() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [staff, setStaff] = useState<ApiStaff[]>([]);
  const [beds, setBeds] = useState<ApiBed[]>([]);
  const [admissions, setAdmissions] = useState<ApiAdmittedBed[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      return;
    }
    const searchingTimer = setTimeout(() => setIsSearching(true), 0);
    const timer = setTimeout(async () => {
      try {
        const [patientRes, staffRes, bedRes, admittedRes] = await Promise.all([
          patientApi.search(q).catch(() => ({ patients: [] as ApiPatient[] })),
          staffApi.getAll().catch(() => ({ staff: [] as ApiStaff[] })),
          bedApi.getAll().catch(() => ({ beds: [] as ApiBed[] })),
          bedApi.admitted().catch(() => ({ beds: [] as ApiAdmittedBed[] })),
        ]);
        setPatients(patientRes.patients);
        const lower = q.toLowerCase();
        setStaff(staffRes.staff.filter((s) => s.name.toLowerCase().includes(lower) || s.email.toLowerCase().includes(lower)));
        setBeds(
          bedRes.beds.filter(
            (b) =>
              b.bedNumber.toLowerCase().includes(lower) ||
              b.ward.toLowerCase().includes(lower) ||
              (b.patient?.name.toLowerCase().includes(lower) ?? false)
          )
        );
        setAdmissions(
          admittedRes.beds.filter(
            (b) =>
              b.patient !== null &&
              (b.patient.name.toLowerCase().includes(lower) ||
                b.bedNumber.toLowerCase().includes(lower) ||
                b.ward.toLowerCase().includes(lower))
          )
        );
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(searchingTimer);
      clearTimeout(timer);
    };
  }, [query]);

  const groups: SearchGroup[] = [
    {
      label: "Patients",
      Icon: User,
      results: patients.map((p) => ({
        id: p.id,
        primary: p.name,
        secondary: `${p.age}${p.gender}${p.phone ? ` · ${p.phone}` : ""} · ID ${p.id.slice(0, 8)}`,
        onSelect: () => navigate("/patients"),
      })),
    },
    {
      label: "Beds",
      Icon: BedDouble,
      results: beds.map((b) => ({
        id: b.id,
        primary: `Bed ${b.bedNumber} · ${b.ward} ward`,
        secondary: b.patient ? `Occupied by ${b.patient.name}` : "Available",
        onSelect: () => navigate("/beds"),
      })),
    },
    {
      label: "Admissions",
      Icon: ClipboardList,
      results: admissions
        .filter((a): a is ApiAdmittedBed & { patient: NonNullable<ApiAdmittedBed["patient"]> } => a.patient !== null)
        .map((a) => ({
          id: a.id,
          primary: a.patient.name,
          secondary: `Admitted · Bed ${a.bedNumber} · ${a.ward} ward`,
          onSelect: () => navigate("/admitted"),
        })),
    },
    {
      label: "Staff",
      Icon: UserCog,
      results: staff.map((s) => ({
        id: s.id,
        primary: s.name,
        secondary: `${s.role} · ${s.email}`,
        onSelect: () => navigate("/settings"),
      })),
    },
  ].filter((g) => g.results.length > 0);

  const hasQuery = query.trim().length >= 2;
  // Stale results from a previous (now-cleared) query are simply not shown
  // once hasQuery is false — no need to reset state synchronously in the effect.
  const visibleGroups = hasQuery ? groups : [];

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md hidden sm:block">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search patients, phone numbers, beds, staff…"
        aria-label="Universal search"
        className="w-full pl-9 pr-8 py-1.5 border border-slate-200 bg-slate-50 rounded-md text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
      />
      {query && (
        <button
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X size={13} />
        </button>
      )}

      {open && hasQuery && (
        <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isSearching ? (
            <p className="text-xs text-slate-400 text-center py-6">Searching…</p>
          ) : visibleGroups.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No matches for "{query}".
            </p>
          ) : (
            visibleGroups.map((group) => (
              <div key={group.label} className="border-b border-slate-100 last:border-0">
                <p className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <group.Icon size={11} />
                  {group.label}
                </p>
                {group.results.slice(0, 5).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      r.onSelect();
                      setOpen(false);
                      setQuery("");
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-900">{r.primary}</p>
                    <p className="text-xs text-slate-500">{r.secondary}</p>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
