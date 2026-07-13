import { useQuery } from "@tanstack/react-query";
import { UserCog } from "lucide-react";
import { staffApi } from "../../services/api";

// Doctor assignment UI — lists doctors from the existing staff endpoint.
// Workload and "current patients" are not tracked by the backend yet (no
// patient↔doctor relationship exists), so both render as "—" rather than a
// fabricated number.
// TODO(backend): add a doctor-assignment endpoint (e.g. PATCH
// /api/patients/:id/doctor) plus a per-doctor current-patient count and
// workload metric; wire the "Assign" button to it once available.
export function DoctorAssignment({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffApi.getAll(),
  });

  const doctors = (data?.staff ?? []).filter((s) => s.role === "DOCTOR");

  if (isLoading) {
    return <p className="text-xs text-slate-400">Loading doctors…</p>;
  }

  if (doctors.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        No doctors on staff yet. Add one from Settings → Staff.
      </p>
    );
  }

  return (
    <ul className={compact ? "space-y-2" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
      {doctors.map((doc) => {
        const isActive = doc.status === "ACTIVE";
        return (
          <li
            key={doc.id}
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2.5"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {doc.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">Dr. {doc.name}</p>
              <p className="text-xs text-slate-500">General department · Current patients — · Workload —</p>
            </div>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {isActive ? "Available" : "Unavailable"}
            </span>
            <button
              type="button"
              title="Doctor assignment is not yet wired to the backend"
              disabled
              className="text-xs font-semibold text-blue-300 border border-blue-100 rounded-md px-2.5 py-1 cursor-not-allowed flex-shrink-0"
            >
              <UserCog size={12} className="inline mr-1 -mt-0.5" />
              Assign
            </button>
          </li>
        );
      })}
    </ul>
  );
}
