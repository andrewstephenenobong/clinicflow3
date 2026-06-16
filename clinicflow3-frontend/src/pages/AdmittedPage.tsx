import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bedApi, patientApi } from "../services/api";
import { useToast } from "../context/ToastContext";

function admittedDuration(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

function admittedOn(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString([], {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function AdmittedPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["beds", "admitted"],
    queryFn: () => bedApi.admitted(),
  });

  const [openPatientId, setOpenPatientId] = useState<string | null>(null);

  const beds = data?.beds ?? [];

  const byWard = beds.reduce<Record<string, typeof beds>>((acc, b) => {
    (acc[b.ward] ||= []).push(b);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-20 text-sm text-slate-400">
          Loading admitted patients…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admitted Patients</h1>
        <p className="text-sm text-slate-500 mt-1">
          {beds.length} {beds.length === 1 ? "patient" : "patients"} currently in a bed
        </p>
      </div>

      {beds.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg px-5 py-12 text-center">
          <p className="text-sm text-slate-400">
            No patients are currently admitted. Assign a seen patient to a bed from the Beds page.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byWard).map(([ward, wardBeds]) => (
            <section key={ward}>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                {ward} ward
              </h2>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <ul className="divide-y divide-slate-100">
                  {wardBeds.map((bed) => (
                    <li key={bed.id}>
                      <button
                        onClick={() => bed.patient && setOpenPatientId(bed.patient.id)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center justify-center">
                            {bed.bedNumber}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {bed.patient?.name ?? "Unknown"}
                              {bed.patient && (
                                <span className="ml-2 text-sm font-normal text-slate-500">
                                  · {bed.patient.age}{bed.patient.gender}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {bed.patient?.phone ?? "no phone on file"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-700">
                            {admittedDuration(bed.admittedAt)}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            since {admittedOn(bed.admittedAt)}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

      {openPatientId && (
        <PatientPanel
          patientId={openPatientId}
          onClose={() => setOpenPatientId(null)}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

// ── Patient detail slide-over panel ──────────────────────────────────────────

function PatientPanel({
  patientId,
  onClose,
  formatDate,
}: {
  patientId: string;
  onClose: () => void;
  formatDate: (iso: string) => string;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => patientApi.getOne(patientId),
  });

  const patient = data?.patient;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    phone: "", address: "", nextOfKin: "",
    bloodGroup: "", allergies: "", chronicConditions: "",
  });

  // When entering edit mode, seed the form from the loaded patient.
  const startEdit = () => {
    if (!patient) return;
    setForm({
      phone: patient.phone ?? "",
      address: patient.address ?? "",
      nextOfKin: patient.nextOfKin ?? "",
      bloodGroup: patient.bloodGroup ?? "",
      allergies: patient.allergies ?? "",
      chronicConditions: patient.chronicConditions ?? "",
    });
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await patientApi.update(patientId, form);
      await queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      showToast("Patient record updated");
      setEditing(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 flex justify-end z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-slate-900">Patient record</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {isLoading || !patient ? (
          <div className="px-6 py-10 text-center text-sm text-slate-400">
            Loading record…
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Name + basics */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xl font-bold text-slate-900">{patient.name}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {patient.age}{patient.gender}
                  {patient.bloodGroup ? ` · Blood group ${patient.bloodGroup}` : ""}
                </p>
              </div>
              {!editing && (
                <button
                  onClick={startEdit}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md px-3 py-1.5"
                >
                  Edit details
                </button>
              )}
            </div>

            {editing ? (
              /* ── Edit form ── */
              <div className="space-y-3">
                <EditableField label="Phone" value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })} />
                <EditableField label="Address" value={form.address}
                  onChange={(v) => setForm({ ...form, address: v })} />
                <EditableField label="Next of kin" value={form.nextOfKin}
                  onChange={(v) => setForm({ ...form, nextOfKin: v })} />
                <EditableField label="Blood group" value={form.bloodGroup}
                  onChange={(v) => setForm({ ...form, bloodGroup: v })} placeholder="e.g. O+" />
                <EditableField label="Allergies" value={form.allergies}
                  onChange={(v) => setForm({ ...form, allergies: v })}
                  placeholder="e.g. Penicillin" textarea />
                <EditableField label="Chronic conditions" value={form.chronicConditions}
                  onChange={(v) => setForm({ ...form, chronicConditions: v })}
                  placeholder="e.g. Hypertension" textarea />

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-slate-300"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── Read-only view ── */
              <>
                {patient.allergies && (
                  <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wide">⚠ Allergies</p>
                    <p className="text-sm text-red-900 mt-1">{patient.allergies}</p>
                  </div>
                )}
                {patient.chronicConditions && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Chronic conditions</p>
                    <p className="text-sm text-amber-900 mt-1">{patient.chronicConditions}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <DetailRow label="Phone" value={patient.phone} />
                  <DetailRow label="Address" value={patient.address} />
                  <DetailRow label="Next of kin" value={patient.nextOfKin} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Visit history
                  </p>
                  {patient.visits.length === 0 ? (
                    <p className="text-xs text-slate-400">No visits on record.</p>
                  ) : (
                    <ul className="space-y-2">
                      {patient.visits.map((v) => (
                        <li
                          key={v.id}
                          className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-800">{v.reason}</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              v.triage === "EMERGENCY"
                                ? "bg-red-100 text-red-700"
                                : v.triage === "URGENT"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {v.triage}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(v.checkedInAt)} · {v.status}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 text-right">{value || "—"}</span>
    </div>
  );
}

function EditableField({
  label, value, onChange, placeholder, textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )}
    </div>
  );
}