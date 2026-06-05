import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "../components/ui/Badge";
import { patientApi } from "../services/api";
import type { Triage } from "../types";

function triageVariant(t: Triage) {
  return t === "EMERGENCY" ? "emergency" : t === "URGENT" ? "urgent" : "routine";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function PatientsPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: () => patientApi.getAll(),
  });

  const patients = data?.patients ?? [];

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-20 text-sm text-slate-400">
          Loading patients...
        </div>
      </div>
    );
  }

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

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="w-full max-w-sm px-3 py-2 border border-slate-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            {filtered.map((patient) => {
              const isExpanded = expandedId === patient.id;
              return (
                <li key={patient.id}>
                  {/* Patient row */}
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : patient.id)
                    }
                    className="w-full flex items-center justify-between px-5 py-4
                               hover:bg-slate-50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {patient.name}
                        <span className="ml-2 text-sm font-normal text-slate-500">
                          · {patient.age}{patient.gender}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {patient.phone ?? "no phone on file"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <span className="text-slate-400 text-lg">
                        {isExpanded ? "▾" : "▸"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded visit history */}
                  {isExpanded && (
                    <VisitHistory patientId={patient.id} />
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

// Loads visit history on demand when a patient row is expanded
function VisitHistory({ patientId }: { patientId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => patientApi.getOne(patientId),
  });

  if (isLoading) {
    return (
      <div className="px-5 pb-4 bg-slate-50/50 text-xs text-slate-400">
        Loading visits...
      </div>
    );
  }

  const visits = data?.patient?.visits ?? [];

  return (
    <div className="px-5 pb-4 bg-slate-50/50">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        Visit history
      </p>
      {visits.length === 0 ? (
        <p className="text-xs text-slate-400">No visits on record.</p>
      ) : (
        <ul className="space-y-2">
          {visits.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between bg-white border
                         border-slate-200 rounded-md px-3 py-2"
            >
              <div>
                <p className="text-sm text-slate-800">{v.reason}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDate(v.checkedInAt)} · {v.status}
                </p>
              </div>
              <Badge variant={triageVariant(v.triage as Triage)}>
                {v.triage}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
