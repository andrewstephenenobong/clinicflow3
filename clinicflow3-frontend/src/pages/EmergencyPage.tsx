import { useState } from "react";
import { Flame, Ambulance, ShieldCheck, Pill, Recycle, Phone, TriangleAlert, History } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";

interface ContactEntry {
  name: string;
  phone: string;
  note: string;
}

interface ContactSection {
  category: string;
  Icon: LucideIcon;
  color: string;
  contacts: ContactEntry[];
}

const EMERGENCY_CONTACTS: ContactSection[] = [
  {
    category: "Fire Service",
    Icon: Flame,
    color: "red",
    contacts: [
      { name: "Lagos State Fire Service", phone: "01-7944079", note: "24/7 emergency" },
      { name: "Federal Fire Service", phone: "080-13432208", note: "National" },
    ],
  },
  {
    category: "Ambulance / NEMA",
    Icon: Ambulance,
    color: "rose",
    contacts: [
      { name: "NEMA Emergency Line", phone: "0800-CALL-NEMA", note: "National" },
      { name: "Lagos State Ambulance", phone: "767", note: "Lagos" },
    ],
  },
  {
    category: "Police",
    Icon: ShieldCheck,
    color: "blue",
    contacts: [
      { name: "Emergency Police Line", phone: "199", note: "Nationwide" },
      { name: "Police Hotline", phone: "0800-CALL-POLICE", note: "Alternate" },
    ],
  },
  {
    category: "Medical Supply Vendors",
    Icon: Pill,
    color: "emerald",
    contacts: [
      { name: "HealthPlus Pharmacy", phone: "0700-HEALTHPLUS", note: "24h delivery" },
      { name: "Medstore Nigeria", phone: "0909-000-0001", note: "Wholesale" },
    ],
  },
  {
    category: "Waste Management",
    Icon: Recycle,
    color: "amber",
    contacts: [
      { name: "Lagos Waste Management", phone: "0700-LAWMA-NG", note: "Medical waste" },
      { name: "Enviroserve Nigeria", phone: "0800-111-2222", note: "Hazardous disposal" },
    ],
  },
];

const colorMap: Record<string, { bg: string; border: string; badge: string; badgeText: string; icon: string }> = {
  red:     { bg: "bg-red-50",     border: "border-red-200",     badge: "bg-red-100",     badgeText: "text-red-700",     icon: "text-red-500"     },
  rose:    { bg: "bg-rose-50",    border: "border-rose-200",    badge: "bg-rose-100",    badgeText: "text-rose-700",    icon: "text-rose-500"    },
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    badge: "bg-blue-100",    badgeText: "text-blue-700",    icon: "text-blue-500"    },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100", badgeText: "text-emerald-700", icon: "text-emerald-500" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   badge: "bg-amber-100",   badgeText: "text-amber-700",   icon: "text-amber-500"   },
};

const DEPARTMENT_OPTIONS = [
  "Emergency Room",
  "Security",
  "Administration",
  "Maintenance",
  "Pharmacy",
] as const;

interface AlertRecord {
  id: string;
  department: string;
  time: string;
}

// SOS activation is UI-only for now — there is no backend endpoint to notify
// staff yet. History is kept in local state so the UI is fully interactive
// and testable; a real alert would be dispatched server-side.
// TODO(backend): add POST /api/emergency/alerts and persist history there.
export function EmergencyPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [department, setDepartment] = useState<string>(DEPARTMENT_OPTIONS[0]);
  const [history, setHistory] = useState<AlertRecord[]>([]);

  const triggerAlert = () => {
    const record: AlertRecord = {
      id: `alert-${Date.now()}`,
      department,
      time: new Date().toLocaleString([], {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      }),
    };
    setHistory((cur) => [record, ...cur]);
    setConfirmOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Emergency & Support"
        description="SOS alert, emergency contacts, and hospital support resources."
      />

      <div className="bg-white border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-2 justify-center mb-1">
          <TriangleAlert size={16} className="text-red-600" />
          <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            SOS Emergency Alert
          </p>
        </div>
        <p className="text-xs text-slate-500 mb-5 text-center">
          Select the department to notify, then confirm to trigger an alert.
        </p>

        <div className="max-w-xs mx-auto mb-5">
          <label className="block text-xs font-medium text-slate-700 mb-1 text-left">
            Notify department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            {DEPARTMENT_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setConfirmOpen(true)}
          className="w-32 h-32 rounded-full text-white font-bold text-lg shadow-lg select-none
                     transition-colors mx-auto block border-4 bg-red-600 border-red-800 hover:bg-red-700"
        >
          SOS
        </button>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <History size={12} />
          Alert History
        </h2>
        {history.length === 0 ? (
          <EmptyState
            Icon={History}
            title="No alerts sent"
            description="Activated SOS alerts for this session will be listed here."
          />
        ) : (
          <ul className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
            {history.map((h) => (
              <li key={h.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
                  <p className="text-sm font-medium text-slate-900">Alert sent to {h.department}</p>
                </div>
                <p className="text-xs text-slate-500">{h.time}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Emergency & Support Contacts
        </h2>
        <div className="space-y-4">
          {EMERGENCY_CONTACTS.map((section) => {
            const c = colorMap[section.color] ?? colorMap["blue"];
            return (
              <div
                key={section.category}
                className={`${c.bg} ${c.border} border rounded-xl overflow-hidden`}
              >
                <div className={`px-5 py-3 border-b ${c.border} flex items-center gap-2`}>
                  <section.Icon size={15} className={c.icon} />
                  <p className="font-semibold text-slate-800 text-sm">
                    {section.category}
                  </p>
                </div>
                <ul className="divide-y divide-white/60">
                  {section.contacts.map((contact) => (
                    <li
                      key={contact.name}
                      className="px-5 py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{contact.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{contact.note}</p>
                      </div>
                      <a
                        href={`tel:${contact.phone}`}
                        className={`flex items-center gap-1.5 text-sm font-bold ${c.badgeText} ${c.badge} px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity`}
                      >
                        <Phone size={13} />
                        {contact.phone}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Send SOS alert?"
        message={`This will notify the ${department} department immediately. Only use this for genuine emergencies.`}
        confirmLabel="Send alert"
        danger
        onConfirm={triggerAlert}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
