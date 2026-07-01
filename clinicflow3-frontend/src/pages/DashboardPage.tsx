import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { dashboardApi, queueApi } from "../services/api";
import { WelcomeBanner } from "../components/ui/WelcomeBanner";

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  icon?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4">
      {icon && (
        <span className="text-2xl mt-0.5 flex-shrink-0">{icon}</span>
      )}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function QuickActionCard({
  to,
  icon,
  title,
  description,
  accent,
}: {
  to: string;
  icon: string;
  title: string;
  description: string;
  accent?: string;
}) {
  return (
    <Link
      to={to}
      className={`bg-white border rounded-xl p-5 hover:shadow-md transition-all group ${
        accent ?? "border-slate-200 hover:border-blue-300"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <p className="font-semibold text-slate-900 mt-2 group-hover:text-blue-700 transition-colors">
        {title}
      </p>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </Link>
  );
}

export function DashboardPage() {
  const { currentClinic } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardApi.getStats(),
  });

  const { data: queueData } = useQuery({
    queryKey: ["queue", "today"],
    queryFn: () => queueApi.getToday(),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-20 text-sm text-slate-400">
          Loading dashboard...
        </div>
      </div>
    );
  }

  const stats = data;
  const waitingNow = queueData?.visits?.filter((v) => v.status === "WAITING").length ?? 0;
  const emergencyNow = queueData?.visits?.filter(
    (v) => v.status === "WAITING" && v.triage === "EMERGENCY"
  ).length ?? 0;
  const stillWaiting =
    (stats?.patientsCheckedInToday ?? 0) - (stats?.patientsSeenToday ?? 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {stats?.totalPatients === 0 && <WelcomeBanner />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            {currentClinic?.name} · Operational overview
          </p>
        </div>
        <Link
          to="/queue"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <span>🏥</span> View Queue
        </Link>
      </div>

      {/* Live queue snapshot — primary action area */}
      {emergencyNow > 0 && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl px-5 py-4 flex items-center gap-4">
          <span className="text-3xl animate-pulse">🚨</span>
          <div>
            <p className="font-bold text-red-800 text-lg">
              {emergencyNow} Emergency {emergencyNow === 1 ? "Patient" : "Patients"} Waiting
            </p>
            <p className="text-sm text-red-700 mt-0.5">
              Immediate attention required in the queue.
            </p>
          </div>
          <Link
            to="/queue"
            className="ml-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0"
          >
            Go to Queue →
          </Link>
        </div>
      )}

      {/* Today's live stats */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Today's Operations
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Checked in"
            value={stats?.patientsCheckedInToday ?? 0}
            sub="patients today"
            color="text-blue-600"
            icon="📥"
          />
          <StatCard
            label="Seen"
            value={stats?.patientsSeenToday ?? 0}
            sub="consultations done"
            color="text-emerald-600"
            icon="✅"
          />
          <StatCard
            label="Still waiting"
            value={stillWaiting < 0 ? 0 : stillWaiting}
            sub="in queue now"
            color={stillWaiting > 5 ? "text-red-600" : "text-amber-600"}
            icon="⏳"
          />
          <StatCard
            label="Beds available"
            value={stats?.availableBeds ?? 0}
            sub={`of ${stats?.totalBeds ?? 0} total`}
            color="text-slate-900"
            icon="🛏"
          />
        </div>
      </div>

      {/* Waiting queue snapshot */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Waiting Patients
          </p>
          <span className={`text-sm font-bold ${waitingNow > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {waitingNow} now
          </span>
        </div>
        {waitingNow === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            No patients waiting. 🎉
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(queueData?.visits ?? [])
              .filter((v) => v.status === "WAITING")
              .slice(0, 5)
              .map((v) => {
                const waitMs = Date.now() - new Date(v.checkedInAt).getTime();
                const waitMin = Math.floor(waitMs / 60000);
                const waitColor =
                  waitMin >= 60
                    ? "text-red-700 bg-red-50 border-red-200"
                    : waitMin >= 30
                    ? "text-orange-700 bg-orange-50 border-orange-200"
                    : waitMin >= 15
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-emerald-700 bg-emerald-50 border-emerald-200";
                return (
                  <li
                    key={v.id}
                    className={`px-5 py-3 flex items-center justify-between ${
                      v.triage === "EMERGENCY" ? "bg-red-50/60" : ""
                    }`}
                  >
                    <div>
                      <span className="font-medium text-slate-900 text-sm">
                        {v.patient.name}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        {v.patient.age}{v.patient.gender}
                      </span>
                      {v.triage === "EMERGENCY" && (
                        <span className="ml-2 text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded">
                          🚨 EMERGENCY
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${waitColor}`}
                    >
                      {waitMin < 1 ? "just now" : `${waitMin}m`}
                    </span>
                  </li>
                );
              })}
            {waitingNow > 5 && (
              <li className="px-5 py-3 text-center text-xs text-slate-400">
                +{waitingNow - 5} more ·{" "}
                <Link to="/queue" className="text-blue-600 hover:underline font-semibold">
                  View full queue
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* All-time stats */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          All Time
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Total patients" value={stats?.totalPatients ?? 0} sub="registered" color="text-slate-900" icon="👥" />
          <StatCard label="Staff members" value={stats?.totalStaff ?? 0} sub="on your team" color="text-slate-900" icon="👨‍⚕️" />
          <StatCard label="Total beds" value={stats?.totalBeds ?? 0} sub="across all wards" color="text-slate-900" icon="🏨" />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <QuickActionCard to="/queue" icon="🏥" title="Manage Queue" description="Check in patients and call them to the doctor" />
          <QuickActionCard to="/patients" icon="👥" title="Patient Records" description="Search, view, and update patient profiles" />
          <QuickActionCard to="/beds" icon="🛏" title="Bed Management" description="Assign and discharge patients from beds" />
          <QuickActionCard to="/emergency" icon="🆘" title="Emergency / SOS" description="Emergency contacts and SOS alert" accent="border-red-200 hover:border-red-400" />
          <QuickActionCard to="/consent" icon="📄" title="Consent Forms" description="Print patient consent and agreement forms" />
          <QuickActionCard to="/settings" icon="⚙️" title="Settings" description="Manage clinic profile, staff, and beds" />
        </div>
      </div>
    </div>
  );
}
