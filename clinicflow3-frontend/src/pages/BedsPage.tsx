import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { ClinicContext, Bed } from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { bedApi } from "../services/api";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

function bedStyles(status: Bed["status"]) {
  return status === "AVAILABLE"
    ? "bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-emerald-900"
    : "bg-rose-50 border-rose-200 hover:border-rose-400 text-rose-900";
}

export function BedsPage() {
  const { beds, assignBed, dischargeBed } = useOutletContext<ClinicContext>();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // Only doctors and admins can admit/discharge (clinical action).
  const canManage = currentUser?.role === "ADMIN" || currentUser?.role === "DOCTOR";

  const [assignTarget, setAssignTarget] = useState<Bed | null>(null);
  const [dischargeTarget, setDischargeTarget] = useState<Bed | null>(null);

  const byWard = beds.reduce<Record<string, Bed[]>>((acc, b) => {
    (acc[b.ward] ||= []).push(b);
    return acc;
  }, {});

  const available = beds.filter((b) => b.status === "AVAILABLE").length;
  const occupied = beds.length - available;

  const handleBedClick = (bed: Bed) => {
    if (!canManage) return; // receptionists view only
    if (bed.status === "AVAILABLE") {
      setAssignTarget(bed);
    } else {
      setDischargeTarget(bed);
    }
  };

  const confirmDischarge = async () => {
    if (!dischargeTarget) return;
    const bed = dischargeTarget;
    setDischargeTarget(null);
    try {
      await dischargeBed(bed.id);
      showToast(`Discharged from bed ${bed.bedNumber}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to discharge", "error");
    }
  };

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
                  onClick={() => handleBedClick(bed)}
                  disabled={!canManage}
                  className={`p-4 rounded-lg border-2 transition-colors text-left ${bedStyles(bed.status)} ${
                    canManage ? "" : "cursor-default"
                  }`}
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
        {canManage
          ? "Tap a free bed to admit a patient, or an occupied bed to discharge. Manage your bed layout in Settings → Beds."
          : "Bed assignment is managed by doctors and admins."}
      </p>

      {/* Assign dialog */}
      {assignTarget && (
        <AssignDialog
          bed={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssign={async (patientId) => {
            const bed = assignTarget;
            setAssignTarget(null);
            try {
              await assignBed(bed.id, patientId);
              showToast(`Admitted to bed ${bed.bedNumber}`);
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Failed to admit", "error");
            }
          }}
        />
      )}

      {/* Discharge confirm */}
      <ConfirmDialog
        open={dischargeTarget !== null}
        title="Discharge patient"
        message={
          dischargeTarget
            ? `Discharge ${dischargeTarget.patientName ?? "this patient"} from bed ${dischargeTarget.bedNumber}? The bed will become available.`
            : ""
        }
        confirmLabel="Discharge"
        danger
        onConfirm={confirmDischarge}
        onCancel={() => setDischargeTarget(null)}
      />
    </div>
  );
}

// ── Assign dialog ────────────────────────────────────────────────────────────

interface AssignDialogProps {
  bed: Bed;
  onClose: () => void;
  onAssign: (patientId: string) => void;
}

function AssignDialog({ bed, onClose, onAssign }: AssignDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["beds", "assignable"],
    queryFn: () => bedApi.assignable(),
  });

  const patients = data?.patients ?? [];

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Admit to bed {bed.bedNumber}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {bed.ward} ward · choose a patient who has been seen.
          </p>
        </div>

        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-slate-400 text-center py-6">Loading patients…</p>
          ) : patients.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No patients are ready to admit. A patient must be marked “seen” first,
              and not already in a bed.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {patients.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => onAssign(p.id)}
                    className="w-full flex items-center justify-between px-2 py-3 hover:bg-slate-50 rounded-md text-left transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        {p.age}{p.gender}{p.phone ? ` · ${p.phone}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-blue-600">Admit →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
