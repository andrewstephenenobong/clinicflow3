import { ClipboardList, Pill, UserCog, User, CreditCard, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function PatientPortalPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Patient Portal</h1>
        <p className="text-sm text-slate-500 mt-1">
          Read-only patient-facing views — medical history, prescriptions, and appointments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PortalCard
          Icon={ClipboardList}
          title="Medical History"
          description="View past diagnoses, visit notes, and clinical records."
          badge="Read-only"
          color="blue"
        />
        <PortalCard
          Icon={Pill}
          title="Prescriptions"
          description="Current and past medication prescriptions issued by your doctor."
          badge="Read-only"
          color="emerald"
        />
        <PortalCard
          Icon={UserCog}
          title="Assigned Doctor"
          description="Contact info and profile of your assigned physician."
          badge="Read-only"
          color="purple"
        />
        <PortalCard
          Icon={User}
          title="My Profile"
          description="View your personal and demographic information on file."
          badge="Read-only"
          color="slate"
        />
        <PortalCard
          Icon={CreditCard}
          title="Payments"
          description="View bills, payment history, and outstanding balances."
          badge="Coming Soon"
          color="amber"
          disabled
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-1.5">
          <Lock size={14} />
          This portal is read-only
        </p>
        <p className="text-xs text-blue-700">
          Patients can view their records here. All data is provided by the clinical team.
          Full self-service features are coming in a future update.
        </p>
      </div>
    </div>
  );
}

function PortalCard({
  Icon, title, description, badge, color, disabled,
}: {
  Icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  color: string;
  disabled?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue:    "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    purple:  "bg-purple-50 border-purple-200 text-purple-700",
    slate:   "bg-slate-100 border-slate-200 text-slate-600",
    amber:   "bg-amber-50 border-amber-200 text-amber-700",
  };

  const iconColorMap: Record<string, string> = {
    blue:    "text-blue-500",
    emerald: "text-emerald-500",
    purple:  "text-purple-500",
    slate:   "text-slate-400",
    amber:   "text-amber-500",
  };

  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-5 ${
        disabled ? "opacity-50" : "hover:border-blue-300 transition-colors"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <Icon size={20} className={iconColorMap[color]} />
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorMap[color]}`}
        >
          {badge}
        </span>
      </div>
      <p className="font-semibold text-slate-900 mt-2">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </div>
  );
}
