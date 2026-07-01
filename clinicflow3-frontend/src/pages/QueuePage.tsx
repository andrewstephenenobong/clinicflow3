import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "../components/ui/Badge";
import { queueApi, patientApi } from "../services/api";
import type { ApiPatient } from "../services/api";
import { useToast } from "../context/ToastContext";
import type { Triage, VisitStatus, Visit } from "../types";
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" });
}

function formatDOB(dob: string | null): string {
  if (!dob) return "";
  return new Date(dob).toLocaleDateString([], {
    day: "numeric", month: "short", year: "numeric",
  });
}

/** Returns waiting minutes from checkedInAt ISO string */
function waitingMinutes(checkedInAt: string): number {
  return Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 60000);
}

/** Color-coded pill based on wait time */
function WaitBadge({ checkedInAt }: { checkedInAt: string }) {
  const min = waitingMinutes(checkedInAt);
  const label = min < 1 ? "< 1 min" : min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}m`;
  const cls =
    min >= 60
      ? "bg-red-100 text-red-700 border border-red-200"
      : min >= 30
      ? "bg-orange-100 text-orange-700 border border-orange-200"
      : min >= 15
      ? "bg-amber-100 text-amber-700 border border-amber-200"
      : "bg-emerald-100 text-emerald-700 border border-emerald-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      ⏱ {label}
    </span>
  );
}

export function QueuePage() {
  const { visits, isLoadingQueue } = useOutletContext<ClinicContext>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const callVisit = async (id: string) => {
    setActionLoading(id);
    try {
      await queueApi.call(id);
      queryClient.invalidateQueries({ queryKey: ["queue", "today"] });
      showToast("Patient called to doctor");
    } catch {
      showToast("Failed to call patient", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const markSeen = async (id: string) => {
    setActionLoading(id);
    try {
      await queueApi.markSeen(id);
      queryClient.invalidateQueries({ queryKey: ["queue", "today"] });
      showToast("Patient marked as seen");
    } catch {
      showToast("Failed to mark patient as seen", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const sortByTriageThenTime = (a: Visit, b: Visit) => {
    const t = triageOrder[a.triage] - triageOrder[b.triage];
    return t !== 0 ? t : a.checkedInAt.localeCompare(b.checkedInAt);
  };

  const allWaiting = visits.filter((v) => v.status === "WAITING");
  const waitingToday = allWaiting.filter((v) => !v.isCarriedOver).sort(sortByTriageThenTime);
  const waitingCarried = allWaiting.filter((v) => v.isCarriedOver).sort(sortByTriageThenTime);
  const called = visits.filter((v) => v.status === "CALLED");

  if (isLoadingQueue) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-20 text-sm text-slate-400">
          Loading queue...
        </div>
      </div>
    );
  }

  const waitingRow = (visit: Visit, index: number) => {
    const isEmergency = visit.triage === "EMERGENCY";
    return (
      <li
        key={visit.id}
        className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors ${
          isEmergency ? "bg-red-50/60 hover:bg-red-50" : ""
        }`}
      >
        {/* Position number */}
        <span
          className={`mt-0.5 w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0 ${
            isEmergency ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {index + 1}
        </span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{visit.patient.name}</p>
            <span className="text-xs text-slate-500">
              {visit.patient.age}{visit.patient.gender}
            </span>
            <Badge variant={triageVariant(visit.triage)}>{visit.triage}</Badge>
            {visit.isCarriedOver && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {formatDate(visit.checkedInAt)}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-0.5 truncate">{visit.reason}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <WaitBadge checkedInAt={visit.checkedInAt} />
            <span className="text-xs text-slate-400">
              Checked in {formatTime(visit.checkedInAt)}
            </span>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={() => callVisit(visit.id)}
          disabled={actionLoading === visit.id}
          className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            isEmergency
              ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white"
              : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white"
          }`}
        >
          {actionLoading === visit.id ? "..." : "Call →"}
        </button>
      </li>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Today's Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            {waitingToday.length} waiting · {called.length} with doctor
            {waitingCarried.length > 0 && ` · ${waitingCarried.length} carried over`}
          </p>
        </div>
        <button
          onClick={() => setShowCheckIn(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm"
        >
          + Check in patient
        </button>
      </div>

      {/* Emergency summary bar */}
      {waitingToday.filter((v) => v.triage === "EMERGENCY").length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-300 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-xl animate-pulse">🚨</span>
          <p className="text-sm font-semibold text-red-800">
            {waitingToday.filter((v) => v.triage === "EMERGENCY").length} emergency patient(s) waiting — prioritise immediately
          </p>
        </div>
      )}

      {/* Waiting today */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Waiting</h2>
          <span className="text-xs text-slate-500">{waitingToday.length} patients</span>
        </div>
        {waitingToday.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            No patients waiting. Quiet moment. 🌿
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {waitingToday.map((visit, index) => waitingRow(visit, index))}
          </ul>
        )}
      </div>

      {/* Carried over */}
      {waitingCarried.length > 0 && (
        <div className="mt-6 bg-white border border-amber-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-amber-200 bg-amber-50">
            <h2 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">Carried over</h2>
            <p className="text-xs text-amber-700 mt-0.5">
              Checked in on a previous day and not yet seen. Call them, or mark seen to clear.
            </p>
          </div>
          <ul className="divide-y divide-slate-100">
            {waitingCarried.map((visit, index) => waitingRow(visit, index))}
          </ul>
        </div>
      )}

      {/* With doctor */}
      {called.length > 0 && (
        <div className="mt-6 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">With doctor</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {called.map((visit) => (
              <li key={visit.id} className="flex items-start gap-4 px-5 py-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{visit.patient.name}</p>
                    <span className="text-xs text-slate-500">{visit.patient.age}{visit.patient.gender}</span>
                    <Badge variant={statusVariant(visit.status)}>{visit.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{visit.reason}</p>
                  <div className="mt-1.5">
                    <WaitBadge checkedInAt={visit.checkedInAt} />
                  </div>
                </div>
                <button
                  onClick={() => markSeen(visit.id)}
                  disabled={actionLoading === visit.id}
                  className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                >
                  {actionLoading === visit.id ? "..." : "Mark seen"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showCheckIn && (
        <CheckInDialog
          onClose={() => setShowCheckIn(false)}
          onSuccess={() => {
            setShowCheckIn(false);
            queryClient.invalidateQueries({ queryKey: ["queue", "today"] });
            showToast("Patient checked in successfully");
          }}
        />
      )}
    </div>
  );
}

// ── CheckInDialog ──────────────────────────────────────────────────────────

interface CheckInDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CheckInDialog({ onClose, onSuccess }: CheckInDialogProps) {
  const [name, setName] = useState("");
  const [searchResults, setSearchResults] = useState<ApiPatient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<ApiPatient | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"M" | "F">("F");

  const [reason, setReason] = useState("");
  const [triage, setTriage] = useState<Triage>("ROUTINE");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedPatient || isNewPatient) return;
    if (name.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { patients } = await patientApi.search(name.trim());
        setSearchResults(patients);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [name, selectedPatient, isNewPatient]);

  const resetIdentity = () => {
    setSelectedPatient(null);
    setIsNewPatient(false);
    setShowDropdown(false);
    setSearchResults([]);
    setName("");
  };

  const selectExisting = (patient: ApiPatient) => {
    setSelectedPatient(patient);
    setShowDropdown(false);
  };

  const chooseNew = () => {
    setIsNewPatient(true);
    setShowDropdown(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const capitalised = val.replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
    setName(capitalised);
    if (selectedPatient || isNewPatient) {
      setSelectedPatient(null);
      setIsNewPatient(false);
    }
  };

  const canSubmit = (() => {
    if (!reason.trim()) return false;
    if (selectedPatient) return true;
    if (isNewPatient) return name.trim().length > 0 && dateOfBirth !== "";
    return false;
  })();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError("");

    try {
      let patientId: string;

      if (selectedPatient) {
        patientId = selectedPatient.id;
      } else {
        const { patient } = await patientApi.create(name.trim(), dateOfBirth, gender);
        patientId = patient.id;
      }

      await queueApi.checkIn(patientId, reason.trim(), triage);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check in patient.");
    } finally {
      setIsSubmitting(false);
    }
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
          <p className="text-xs text-slate-500 mt-0.5">
            Search for a returning patient or register a new one.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">

          {selectedPatient ? (
            <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{selectedPatient.name}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {selectedPatient.dateOfBirth
                      ? `${formatDOB(selectedPatient.dateOfBirth)} · Age ${selectedPatient.age}`
                      : `Age ${selectedPatient.age}`}
                    {" · "}{selectedPatient.gender}
                  </p>
                  {selectedPatient.phone && (
                    <p className="text-xs text-slate-500 mt-0.5">{selectedPatient.phone}</p>
                  )}
                </div>
                <button
                  onClick={resetIdentity}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 ml-3 shrink-0"
                >
                  Change
                </button>
              </div>
              <p className="text-xs text-blue-700 mt-2 font-medium">
                ✓ Returning patient — existing record will be used
              </p>
            </div>
          ) : (
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Patient name
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Type to search existing patients…"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />

              {isSearching && (
                <p className="text-xs text-slate-400 mt-1">Searching…</p>
              )}

              {showDropdown && !isNewPatient && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
                  {searchResults.length > 0 && searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectExisting(p)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 text-left border-b border-slate-100 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {p.dateOfBirth
                            ? `${formatDOB(p.dateOfBirth)} · Age ${p.age}`
                            : `Age ${p.age}`}
                          {" · "}{p.gender}
                          {p.phone ? ` · ${p.phone}` : ""}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 ml-2 shrink-0">
                        Select →
                      </span>
                    </button>
                  ))}

                  <button
                    onClick={chooseNew}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-50 text-left text-sm font-semibold text-slate-600 border-t border-slate-200"
                  >
                    <span className="text-base">➕</span>
                    Register "{name}" as a new patient
                  </button>
                </div>
              )}
            </div>
          )}

          {isNewPatient && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  New patient details
                </p>
                <button
                  onClick={resetIdentity}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  ← Back to search
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Gender
                  </label>
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
            </>
          )}

          {(selectedPatient || isNewPatient) && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason for visit
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Persistent headache for 3 days"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus={!!selectedPatient}
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
                      {level === "EMERGENCY" && "🚨 "}
                      {level === "URGENT" && "⚠️ "}
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {!selectedPatient && !isNewPatient && name.trim().length < 2 && (
            <p className="text-xs text-slate-400 text-center py-2">
              Type at least 2 characters to search existing patients.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}
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
            disabled={!canSubmit || isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Adding..." : "Add to queue"}
          </button>
        </div>
      </div>
    </div>
  );
}
