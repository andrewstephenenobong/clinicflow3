import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone, MapPin, User } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { patientApi } from "../services/api";
import type { ApiPatient } from "../services/api";
import type { Triage } from "../types";

function triageVariant(t: Triage) {
  return t === "EMERGENCY" ? "emergency" : t === "URGENT" ? "urgent" : "routine";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    year: "numeric", month: "short", day: "numeric",
  });
}

function maskPhone(phone: string | null): string {
  if (!phone) return "No phone on file";
  if (phone.length <= 4) return phone;
  return phone.slice(0, -4).replace(/\d/g, "•") + phone.slice(-4);
}

function PatientCard({ patient, isExpanded, onToggle }: {
  patient: ApiPatient;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const initial = patient.name.charAt(0).toUpperCase();

  return (
    <li className={`border-b border-slate-100 last:border-0 ${isExpanded ? "bg-slate-50/60" : ""}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{patient.name}</p>
            <span className="text-xs text-slate-500">
              {patient.age}yr · {patient.gender === "M" ? "Male" : patient.gender === "F" ? "Female" : patient.gender}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            {maskPhone(patient.phone)}
          </p>
        </div>

        <span className="text-slate-400 text-lg flex-shrink-0">
          {isExpanded ? "▾" : "▸"}
        </span>
      </button>

      {isExpanded && (
        <VisitHistory patientId={patient.id} />
      )}
    </li>
  );
}

export function PatientsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: () => patientApi.getAll(),
  });

  const patients = data?.patients ?? [];

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (p.phone ?? "").includes(debouncedSearch) ||
    p.id.toLowerCase().includes(debouncedSearch.toLowerCase())
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

      <div className="mb-4 relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or patient ID…"
          className="w-full max-w-sm pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            {search ? "No patients match that search." : "No patients registered."}
          </div>
        ) : (
          <ul>
            {filtered.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                isExpanded={expandedId === patient.id}
                onToggle={() => setExpandedId(expandedId === patient.id ? null : patient.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function VisitHistory({ patientId }: { patientId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => patientApi.getOne(patientId),
  });

  const patient = data?.patient;

  if (isLoading) {
    return (
      <div className="px-5 pb-4 bg-slate-50/50 text-xs text-slate-400">
        Loading patient record...
      </div>
    );
  }

  if (!patient) return null;

  const hasMedicalFlags = patient.allergies || patient.chronicConditions;

  return (
    <div className="px-5 pb-5 bg-slate-50/50 space-y-4">
      {hasMedicalFlags && (
        <div className="space-y-2">
          {patient.allergies && (
            <div className="bg-red-50 border border-red-200 rounded-md px-4 py-2.5 flex items-start gap-2">
              <span className="text-red-600 font-bold text-xs mt-0.5">!</span>
              <div>
                <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Allergies</p>
                <p className="text-sm text-red-900">{patient.allergies}</p>
              </div>
            </div>
          )}
          {patient.chronicConditions && (
            <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-2.5 flex items-start gap-2">
              <span className="text-amber-700 font-bold text-xs mt-0.5">Dx</span>
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Chronic Conditions</p>
                <p className="text-sm text-amber-900">{patient.chronicConditions}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        {patient.bloodGroup && (
          <span className="font-semibold">Blood: <span className="text-red-700">{patient.bloodGroup}</span></span>
        )}
        {patient.phone && (
          <span className="flex items-center gap-1">
            <Phone size={11} />
            {patient.phone}
          </span>
        )}
        {patient.address && (
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {patient.address}
          </span>
        )}
        {patient.nextOfKin && (
          <span className="flex items-center gap-1">
            <User size={11} />
            Next of kin: {patient.nextOfKin}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Visit History
        </p>
        {patient.visits.length === 0 ? (
          <p className="text-xs text-slate-400">No visits on record.</p>
        ) : (
          <ul className="space-y-2">
            {patient.visits.map((v) => (
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
    </div>
  );
}
