import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import type { Triage, Visit, VisitStatus } from "../types";
import type { ClinicContext } from "../components/layout/AppShell";

const triageOrder: Record<Triage, number> = {
  EMERGENCY: 0,
  URGENT: 1,
  ROUTINE: 2,
};

function triageVariant(t: Triage) {
  return t === "EMERGENCY" ? "emergency" : t === "URGENT" ? "urgent" : "routine";
}

function statusVariant(s: VisitStatus) {
  return s === "CALLED" ? "info" : "neutral";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function QueuePage() {
  // Pull the shared state from AppShell instead of using local state
  const { visits, setVisits } = useOutletContext<ClinicContext>();

  const [showCheckIn, setShowCheckIn] = useState(false);

  const callVisit = (id: string) => {
    setVisits((current) =>
      current.map((v) => (v.id === id ? { ...v, status: "CALLED" } : v))
    );
  };

  const markSeen = (id: string) => {
    setVisits((current) =>
      current.map((v) => (v.id === id ? { ...v, status: "SEEN" } : v))
    );
  };

  const addVisit = (newVisit: Visit) => {
    setVisits((current) => [...current, newVisit]);
    setShowCheckIn(false);
  };

  const waiting = visits
    .filter((v) => v.status === "WAITING")
    .sort((a, b) => {
      const t = triageOrder[a.triage] - triageOrder[b.triage];
      return t !== 0 ? t : a.checkedInAt.localeCompare(b.checkedInAt);
    });

  const called = visits.filter((v) => v.status === "CALLED");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Today's Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            {waiting.length} waiting · {called.length} with doctor
          </p>
        </div>
        <button
          onClick={() => setShowCheckIn(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm"
        >
          + Check in patient
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Waiting
          </h2>
        </div>

        {waiting.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            No patients waiting. Quiet moment.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {waiting.map((visit, index) => (
              <li
                key={visit.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-sm font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {visit.patient.name}
                      <span className="ml-2 text-sm font-normal text-slate-500">
                        · {visit.patient.age}{visit.patient.gender}
                      </span>
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">{visit.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={triageVariant(visit.triage)}>{visit.triage}</Badge>
                  <span className="text-xs text-slate-500 w-12 text-right">
                    {formatTime(visit.checkedInAt)}
                  </span>
                  <button
                    onClick={() => callVisit(visit.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                  >
                    Call
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {called.length > 0 && (
        <div className="mt-6 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              With doctor
            </h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {called.map((visit) => (
              <li key={visit.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{visit.patient.name}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{visit.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant(visit.status)}>{visit.status}</Badge>
                  <button
                    onClick={() => markSeen(visit.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                  >
                    Mark seen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showCheckIn && (
        <CheckInDialog onClose={() => setShowCheckIn(false)} onSubmit={addVisit} />
      )}
    </div>
  );
}

// ============================================================================
// CheckInDialog (unchanged from before)
// ============================================================================

interface CheckInDialogProps {
  onClose: () => void;
  onSubmit: (visit: Visit) => void;
}

function CheckInDialog({ onClose, onSubmit }: CheckInDialogProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"M" | "F">("F");
  const [reason, setReason] = useState("");
  const [triage, setTriage] = useState<Triage>("ROUTINE");

  const canSubmit = name.trim() && age.trim() && reason.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    const newId = `v${Date.now()}`;
    const newVisit: Visit = {
      id: newId,
      patient: {
        id: `p${Date.now()}`,
        name: name.trim(),
        age: Number(age),
        gender,
        phone: "",
      },
      reason: reason.trim(),
      triage,
      status: "WAITING",
      checkedInAt: new Date().toISOString(),
    };
    onSubmit(newVisit);
  };

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
          <h2 className="text-lg font-semibold text-slate-900">Check in patient</h2>
          <p className="text-xs text-slate-500 mt-0.5">Add a new patient to the queue.</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Patient name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Adaeze Okafor"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="34"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "M" | "F")}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="F">F</option>
                <option value="M">M</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason for visit
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Routine antenatal check"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Triage</label>
            <div className="grid grid-cols-3 gap-2">
              {(["EMERGENCY", "URGENT", "ROUTINE"] as Triage[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setTriage(level)}
                  className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${
                    triage === level
                      ? level === "EMERGENCY"
                        ? "bg-red-100 text-red-700 border-red-300"
                        : level === "URGENT"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : "bg-slate-100 text-slate-700 border-slate-300"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Add to queue
          </button>
        </div>
      </div>
    </div>
  );
}
