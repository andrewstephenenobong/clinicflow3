import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import type { Patient, Triage, Visit } from "../types";
import type { ClinicContext } from "../components/layout/AppShell";

function triageVariant(t: Triage) {
  return t === "EMERGENCY" ? "emergency" : t === "URGENT" ? "urgent" : "routine";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

interface PatientWithVisits {
  patient: Patient;
  visits: Visit[];
  lastVisit: string;
  totalVisits: number;
}

export function PatientsPage() {
  const { visits } = useOutletContext<ClinicContext>();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Deduplicate: group every visit by patient ID, build a patient-centric view.
  // useMemo means we only recompute when `visits` changes, not on every render.
  const patients: PatientWithVisits[] = useMemo(() => {
    const byPatientId = new Map<string, PatientWithVisits>();

    for (const v of visits) {
      const existing = byPatientId.get(v.patient.id);
      if (existing) {
        existing.visits.push(v);
        existing.totalVisits = existing.visits.length;
        if (v.checkedInAt > existing.lastVisit) existing.lastVisit = v.checkedInAt;
      } else {
        byPatientId.set(v.patient.id, {
          patient: v.patient,
          visits: [v],
          lastVisit: v.checkedInAt,
          totalVisits: 1,
        });
      }
    }

    // Sort by most recent visit
    return Array.from(byPatientId.values()).sort((a, b) =>
      b.lastVisit.localeCompare(a.lastVisit)
    );
  }, [visits]);

  // Filter by search query
  const filtered = patients.filter((p) =>
    p.patient.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-500 mt-1">
            {patients.length} {patients.length === 1 ? "patient" : "patients"} registered
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="w-full max-w-sm px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Patient list */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            {search ? "No patients match that search." : "No patients yet."}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map(({ patient, visits, lastVisit, totalVisits }) => {
              const isExpanded = expandedId === patient.id;
              return (
                <li key={patient.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : patient.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {patient.name}
                        <span className="ml-2 text-sm font-normal text-slate-500">
                          · {patient.age}{patient.gender}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {patient.phone || "no phone on file"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-xs font-medium text-slate-500">Last visit</p>
                        <p className="text-sm text-slate-700">{formatDate(lastVisit)}</p>
                      </div>
                      <div className="w-12">
                        <p className="text-xs font-medium text-slate-500">Visits</p>
                        <p className="text-sm font-semibold text-slate-900">{totalVisits}</p>
                      </div>
                      <span className="text-slate-400 text-lg">
                        {isExpanded ? "▾" : "▸"}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 bg-slate-50/50">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Visit history
                      </p>
                      <ul className="space-y-2">
                        {visits
                          .slice()
                          .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt))
                          .map((v) => (
                            <li
                              key={v.id}
                              className="flex items-center justify-between bg-white border border-slate-200 rounded-md px-3 py-2"
                            >
                              <div>
                                <p className="text-sm text-slate-800">{v.reason}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {formatDate(v.checkedInAt)} · {v.status}
                                </p>
                              </div>
                              <Badge variant={triageVariant(v.triage)}>{v.triage}</Badge>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
