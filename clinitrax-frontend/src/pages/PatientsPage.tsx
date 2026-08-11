import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone, MapPin, User, FileText, StickyNote, Pill } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonList } from "../components/ui/Skeleton";
import { PatientTimeline } from "../components/patient/PatientTimeline";
import type { TimelineEvent } from "../components/patient/PatientTimeline";
import { DoctorAssignment } from "../components/patient/DoctorAssignment";
import { AdmissionHistory } from "../components/patient/AdmissionHistory";
import { patientApi } from "../services/api";
import type { ApiPatient, ApiPatientDetail } from "../services/api";
import type { Triage } from "../types";

function buildTimelineEvents(patient: ApiPatientDetail): TimelineEvent[] {
  const lastVisit = patient.visits[0];
  return [
    { stage: "Registered", timestamp: patient.createdAt },
    { stage: "Checked In", timestamp: lastVisit?.checkedInAt ?? null },
    { stage: "Waiting", timestamp: lastVisit?.status === "WAITING" ? lastVisit.checkedInAt : (lastVisit ? lastVisit.checkedInAt : null) },
    { stage: "Called", timestamp: lastVisit && lastVisit.status !== "WAITING" ? lastVisit.checkedInAt : null },
    { stage: "Seen", timestamp: lastVisit?.seenAt ?? null },
    { stage: "Admitted", timestamp: null, note: "See Admission History below" },
    { stage: "Discharged", timestamp: null },
    { stage: "Follow-up", timestamp: null },
  ];
}

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
        className="group w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
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

        <span
          className={`text-slate-400 text-lg flex-shrink-0 inline-block transition-transform duration-200 ${
            isExpanded ? "rotate-90" : "rotate-0"
          }`}
        >
          ▸
        </span>
      </button>

      {isExpanded && (
        <div className="animate-slide-up">
          <VisitHistory patientId={patient.id} />
        </div>
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

  const { data, isLoading, isError, refetch } = useQuery({
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
        <PageHeader title="Patients" description="Loading registered patients…" />
        <SkeletonList rows={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Patients" />
        <ErrorState message="We couldn't load the patient list." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Patients"
        description={`${patients.length} ${patients.length === 1 ? "patient" : "patients"} registered`}
      />

      <div className="mb-4 relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or patient ID…"
          aria-label="Search patients"
          className="w-full max-w-sm pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            Icon={User}
            title={search ? "No patients match that search" : "No patients registered yet"}
            description={search ? "Try a different name, phone number, or patient ID." : "Patients appear here once checked in from the Queue page."}
          />
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      {children}
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
    <div className="px-5 pb-5 bg-slate-50/50 space-y-5">
      {/* Sticky-style safety banner — kept prominent above everything else */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Personal Details">
          <div className="bg-white border border-slate-200 rounded-md px-3 py-2.5 space-y-1.5 text-sm">
            <p className="flex items-center gap-1.5 text-slate-700">
              <Phone size={11} className="text-slate-400" />
              {patient.phone || "No phone on file"}
            </p>
            {patient.bloodGroup && (
              <p className="text-slate-700">Blood group: <span className="font-semibold text-red-700">{patient.bloodGroup}</span></p>
            )}
          </div>
        </Section>

        <Section title="Address">
          <div className="bg-white border border-slate-200 rounded-md px-3 py-2.5 text-sm text-slate-700 flex items-start gap-1.5">
            <MapPin size={11} className="text-slate-400 mt-0.5 flex-shrink-0" />
            {patient.address || "No address on file"}
          </div>
        </Section>

        <Section title="Guardian">
          <div className="bg-white border border-slate-200 rounded-md px-3 py-2.5 text-sm text-slate-700 flex items-start gap-1.5">
            <User size={11} className="text-slate-400 mt-0.5 flex-shrink-0" />
            {patient.nextOfKin || "Not recorded"}
          </div>
        </Section>

        {/* Emergency contact isn't a distinct field on the backend yet — shown
            as a clearly-labelled placeholder so the layout is ready. */}
        {/* TODO(backend): add a dedicated emergencyContact field to Patient. */}
        <Section title="Emergency Contact">
          <div className="bg-white border border-dashed border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-400">
            Not yet supported — reuses Guardian for now
          </div>
        </Section>
      </div>

      <Section title="Assigned Doctor">
        <DoctorAssignment compact />
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Current Medications">
          <div className="bg-white border border-dashed border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-400 flex items-center gap-1.5">
            <Pill size={12} />
            Not tracked yet
          </div>
        </Section>
        <Section title="Notes">
          <div className="bg-white border border-dashed border-slate-300 rounded-md px-3 py-2.5 text-sm text-slate-400 flex items-center gap-1.5">
            <StickyNote size={12} />
            Clinical notes live on individual visits below
          </div>
        </Section>
      </div>

      <Section title="Visit Timeline">
        <div className="bg-white border border-slate-200 rounded-md px-4 py-3">
          <PatientTimeline events={buildTimelineEvents(patient)} />
        </div>
      </Section>

      <Section title="Admission History">
        <AdmissionHistory patientId={patientId} />
      </Section>

      <Section title="Visit History">
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
      </Section>

      <div className="flex items-center gap-2 pt-1">
        <Link
          to="/consent"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 rounded-md px-3 py-1.5"
        >
          <FileText size={12} />
          Consent Forms
        </Link>
      </div>
    </div>
  );
}
