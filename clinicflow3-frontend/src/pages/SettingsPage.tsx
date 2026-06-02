import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { ClinicContext } from "../components/layout/AppShell";
import type { Bed } from "../data/mockBeds";

export function SettingsPage() {
  const { clinic, updateClinic, beds, addBed, updateBed, removeBed } =
    useOutletContext<ClinicContext>();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure your clinic. More options arrive when accounts and billing are wired in.
        </p>
      </div>

      <ClinicProfileSection clinic={clinic} onSave={updateClinic} />
      <BedManagementSection
        beds={beds}
        onAdd={addBed}
        onUpdate={updateBed}
        onRemove={removeBed}
      />
      <ComingSoonSection />
      <AboutSection />
    </div>
  );
}

// ============================================================================
// CLINIC PROFILE
// ============================================================================

function ClinicProfileSection({
  clinic,
  onSave,
}: {
  clinic: ClinicContext["clinic"];
  onSave: ClinicContext["updateClinic"];
}) {
  // Local draft state — only commits to AppShell when Save is pressed.
  const [draft, setDraft] = useState(clinic);
  const dirty =
    draft.name !== clinic.name ||
    draft.address !== clinic.address ||
    draft.phone !== clinic.phone ||
    draft.email !== clinic.email;

  const field = (label: string, key: keyof typeof draft, type = "text") => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );

  return (
    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Clinic profile
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Shown in the header and on patient-facing pages.</p>
      </div>

      <div className="px-5 py-5 space-y-4">
        {field("Clinic name", "name")}
        {field("Address", "address")}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field("Phone", "phone", "tel")}
          {field("Email", "email", "email")}
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
        <button
          onClick={() => setDraft(clinic)}
          disabled={!dirty}
          className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-md disabled:text-slate-400 disabled:hover:bg-transparent"
        >
          Reset
        </button>
        <button
          onClick={() => onSave(draft)}
          disabled={!dirty}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          Save changes
        </button>
      </div>
    </section>
  );
}

// ============================================================================
// BED MANAGEMENT
// ============================================================================

function BedManagementSection({
  beds,
  onAdd,
  onUpdate,
  onRemove,
}: {
  beds: Bed[];
  onAdd: ClinicContext["addBed"];
  onUpdate: ClinicContext["updateBed"];
  onRemove: ClinicContext["removeBed"];
}) {
  const [newBedNumber, setNewBedNumber] = useState("");
  const [newBedWard, setNewBedWard] = useState("General");

  const wards = Array.from(new Set(beds.map((b) => b.ward))).sort();

  const handleAdd = () => {
    if (!newBedNumber.trim()) return;
    onAdd({
      bedNumber: newBedNumber.trim(),
      ward: newBedWard,
      status: "AVAILABLE",
    });
    setNewBedNumber("");
  };

  return (
    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Beds
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Add, rename, or remove beds. Day-to-day status (free / taken) lives on the Beds page.
        </p>
      </div>

      {/* Add new bed */}
      <div className="px-5 py-4 border-b border-slate-200 bg-blue-50/40">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Add a bed
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-slate-700 mb-1">Bed number</label>
            <input
              type="text"
              value={newBedNumber}
              onChange={(e) => setNewBedNumber(e.target.value)}
              placeholder="e.g. C3"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-slate-700 mb-1">Ward</label>
            <input
              type="text"
              value={newBedWard}
              onChange={(e) => setNewBedWard(e.target.value)}
              placeholder="e.g. General"
              list="known-wards"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <datalist id="known-wards">
              {wards.map((w) => (
                <option key={w} value={w} />
              ))}
            </datalist>
          </div>
          <button
            onClick={handleAdd}
            disabled={!newBedNumber.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Add bed
          </button>
        </div>
      </div>

      {/* Bed list */}
      {beds.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-400">
          No beds yet. Add your first above.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {beds.map((bed) => (
            <BedRow
              key={bed.id}
              bed={bed}
              onUpdate={onUpdate}
              onRemove={onRemove}
              wards={wards}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function BedRow({
  bed,
  onUpdate,
  onRemove,
  wards,
}: {
  bed: Bed;
  onUpdate: ClinicContext["updateBed"];
  onRemove: ClinicContext["removeBed"];
  wards: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [draftNumber, setDraftNumber] = useState(bed.bedNumber);
  const [draftWard, setDraftWard] = useState(bed.ward);

  const save = () => {
    onUpdate(bed.id, { bedNumber: draftNumber.trim(), ward: draftWard.trim() });
    setEditing(false);
  };

  const cancel = () => {
    setDraftNumber(bed.bedNumber);
    setDraftWard(bed.ward);
    setEditing(false);
  };

  return (
    <li className="px-5 py-3 flex items-center gap-3">
      {editing ? (
        <>
          <input
            type="text"
            value={draftNumber}
            onChange={(e) => setDraftNumber(e.target.value)}
            className="w-24 px-2 py-1 border border-slate-300 rounded text-sm"
          />
          <input
            type="text"
            value={draftWard}
            onChange={(e) => setDraftWard(e.target.value)}
            list={`wards-${bed.id}`}
            className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
          />
          <datalist id={`wards-${bed.id}`}>
            {wards.map((w) => <option key={w} value={w} />)}
          </datalist>
          <button onClick={save} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            Save
          </button>
          <button onClick={cancel} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
            Cancel
          </button>
        </>
      ) : (
        <>
          <span className="font-mono font-semibold text-slate-900 w-12">{bed.bedNumber}</span>
          <span className="flex-1 text-sm text-slate-600">{bed.ward} ward</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            bed.status === "AVAILABLE"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-rose-100 text-rose-800"
          }`}>
            {bed.status === "AVAILABLE" ? "Free" : "Taken"}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm(`Remove bed ${bed.bedNumber}? This cannot be undone.`)) {
                onRemove(bed.id);
              }
            }}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
          >
            Remove
          </button>
        </>
      )}
    </li>
  );
}

// ============================================================================
// COMING SOON
// ============================================================================

function ComingSoonSection() {
  const items = [
    { name: "Staff accounts", phase: "Phase 1b — after auth lands" },
    { name: "Subscription & billing", phase: "Phase 3 — Paystack" },
    { name: "Security contact phone", phase: "Phase 3 — login alerts" },
    { name: "Verification PIN", phase: "Phase 3 — out-of-band unlock" },
    { name: "Two-factor authentication", phase: "Phase 3 — TOTP for admins/doctors" },
    { name: "Audit log viewer", phase: "Phase 1b — read-only" },
  ];

  return (
    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Coming soon
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Roadmap for this page.</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.name} className="px-5 py-3 flex items-center justify-between">
            <span className="text-sm text-slate-700">{item.name}</span>
            <span className="text-xs text-slate-400">{item.phase}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ============================================================================
// ABOUT
// ============================================================================

function AboutSection() {
  return (
    <section className="bg-white border border-slate-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
        About
      </h2>
      <div className="space-y-1 text-sm">
        <p className="text-slate-700">
          <span className="font-semibold">ClinicFlow</span> · v0.1.0 (Session 1 preview)
        </p>
        <p className="text-slate-500">
          Hospital & clinic management, built for Nigeria.
        </p>
        <p className="text-slate-500 mt-3 italic">
          Built with purpose. Channeled from pain. Designed for impact. Crafted with care. Made for Nigerian healthcare workers, by a Nigerian founder.
        </p>
        <p className="text-slate-400 text-xs mt-2">
          by Kairos Labs · Andrew Stephen Enobong ·{" "}
          <a
            href="https://github.com/andrewstephenenobong/clinicflow3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            View on GitHub
          </a>
        </p>
      </div>
    </section>
  );
}
