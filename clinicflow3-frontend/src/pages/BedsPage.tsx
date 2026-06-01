import { useOutletContext } from "react-router-dom";
import type { ClinicContext } from "../components/layout/AppShell";
import type { Bed } from "../data/mockBeds";

function bedStyles(status: Bed["status"]) {
  return status === "AVAILABLE"
    ? "bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-emerald-900"
    : "bg-rose-50 border-rose-200 hover:border-rose-400 text-rose-900";
}

export function BedsPage() {
  const { beds, setBeds } = useOutletContext<ClinicContext>();

  // Toggle a single bed's status. In OCCUPIED→AVAILABLE we also clear the patient.
  const toggleBed = (id: string) => {
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

  // Group beds by ward for a clearer layout
  const byWard = beds.reduce<Record<string, Bed[]>>((acc, b) => {
    (acc[b.ward] ||= []).push(b);
    return acc;
  }, {});

  const available = beds.filter((b) => b.status === "AVAILABLE").length;
  const occupied = beds.length - available;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Beds</h1>
          <p className="text-sm text-slate-500 mt-1">
            {available} available · {occupied} occupied · {beds.length} total
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Available</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{available}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Occupied</p>
          <p className="text-3xl font-bold text-rose-600 mt-1">{occupied}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</p>
          <p className="text-3xl font-bold text-slate-700 mt-1">{beds.length}</p>
        </div>
      </div>

      {/* Bed grid grouped by ward */}
      <div className="space-y-6">
        {Object.entries(byWard).map(([ward, wardBeds]) => (
          <section key={ward}>
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
              {ward} ward
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {wardBeds.map((bed) => (
                <button
                  key={bed.id}
                  onClick={() => toggleBed(bed.id)}
                  className={`p-4 rounded-lg border-2 transition-colors text-left ${bedStyles(bed.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl font-bold">{bed.bedNumber}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      bed.status === "AVAILABLE"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}>
                      {bed.status === "AVAILABLE" ? "FREE" : "TAKEN"}
                    </span>
                  </div>
                  <div className="mt-3 text-xs">
                    {bed.patientName ? (
                      <p className="font-medium truncate">{bed.patientName}</p>
                    ) : (
                      <p className="opacity-50">Empty</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-400 text-center">
        Click any bed to toggle status. In Phase 2 you'll assign specific patients from the queue.
      </p>
    </div>
  );
}
