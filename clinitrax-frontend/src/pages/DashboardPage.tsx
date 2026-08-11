import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Inbox,
  CheckCircle2,
  Clock,
  BedDouble,
  Users,
  UserCog,
  Building2,
  ListOrdered,
  FileText,
  Settings,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { dashboardApi, queueApi } from "../services/api";
import { WelcomeBanner } from "../components/ui/WelcomeBanner";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonLine, SkeletonStatGrid } from "../components/ui/Skeleton";

// Extracted as a plain helper (not inline in render) so the impure Date.now()
// call is isolated from the component body, matching the pattern already
// used elsewhere (e.g. QueuePage's waitingMinutes helper).
function waitingMinutesSince(checkedInAt: string): number {
  return Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 60000);
}

function StatCard({
  label,
  value,
  sub,
  color,
  Icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  Icon?: LucideIcon;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300">
      {Icon && (
        <Icon size={22} className={`mt-0.5 flex-shrink-0 ${color}`} />
      )}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className={`text-3xl font-bold ${color} tabular-nums`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function QuickActionCard({
  to,
  Icon,
  title,
  description,
  accent,
}: {
  to: string;
  Icon: LucideIcon;
  title: string;
  description: string;
  accent?: string;
}) {
  return (
    <Link
      to={to}
      className={`bg-white border rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] group ${
        accent ?? "border-slate-200 hover:border-blue-300"
      }`}
    >
      <Icon size={20} className="text-slate-500 group-hover:text-blue-600 transition-all duration-200 group-hover:scale-110" />
      <p className="font-semibold text-slate-900 mt-2 group-hover:text-blue-700 transition-colors">
        {title}
      </p>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </Link>
  );
}

export function DashboardPage() {
  const { currentClinic } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardApi.getStats(),
  });

  const { data: queueData } = useQuery({
    queryKey: ["queue", "today"],
    queryFn: () => queueApi.getToday(),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <SkeletonLine className="h-7 w-40" />
            <SkeletonLine className="h-4 w-56" />
          </div>
        </div>
        <SkeletonStatGrid count={4} />
        <SkeletonStatGrid count={3} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Dashboard" />
        <ErrorState message="We couldn't load your clinic's stats." onRetry={() => refetch()} />
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

      <PageHeader
        title="Dashboard"
        description={`${currentClinic?.name ?? ""} · Operational overview`}
        actions={
          <Link
            to="/queue"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-150 active:scale-95 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <ListOrdered size={15} />
            View Queue
          </Link>
        }
      />

      {emergencyNow > 0 && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl px-5 py-4 flex items-center gap-4 animate-slide-up">
          <AlertTriangle size={24} className="text-red-600 flex-shrink-0 animate-pulse" />
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
            className="ml-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0 transition-all duration-150 active:scale-95 hover:shadow-md"
          >
            Go to Queue
          </Link>
        </div>
      )}

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Today's Operations
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 [&>*]:animate-slide-up [&>*:nth-child(1)]:[animation-delay:0ms] [&>*:nth-child(2)]:[animation-delay:60ms] [&>*:nth-child(3)]:[animation-delay:120ms] [&>*:nth-child(4)]:[animation-delay:180ms]">
          <StatCard
            label="Checked In"
            value={stats?.patientsCheckedInToday ?? 0}
            sub="patients today"
            color="text-blue-600"
            Icon={Inbox}
          />
          <StatCard
            label="Seen"
            value={stats?.patientsSeenToday ?? 0}
            sub="consultations done"
            color="text-emerald-600"
            Icon={CheckCircle2}
          />
          <StatCard
            label="Still Waiting"
            value={stillWaiting < 0 ? 0 : stillWaiting}
            sub="in queue now"
            color={stillWaiting > 5 ? "text-red-600" : "text-amber-600"}
            Icon={Clock}
          />
          <StatCard
            label="Beds Available"
            value={stats?.availableBeds ?? 0}
            sub={`of ${stats?.totalBeds ?? 0} total`}
            color="text-slate-900"
            Icon={BedDouble}
          />
        </div>
      </div>

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
          <EmptyState title="No active patients in queue" description="Checked-in patients waiting to be seen will appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {(queueData?.visits ?? [])
              .filter((v) => v.status === "WAITING")
              .slice(0, 5)
              .map((v) => {
                const waitMin = waitingMinutesSince(v.checkedInAt);
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
                    className={`px-5 py-3 flex items-center justify-between transition-colors hover:bg-slate-50 ${
                      v.triage === "EMERGENCY" ? "bg-red-50/60 hover:bg-red-50" : ""
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
                          EMERGENCY
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

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          All Time
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Total Patients" value={stats?.totalPatients ?? 0} sub="registered" color="text-slate-900" Icon={Users} />
          <StatCard label="Staff Members"  value={stats?.totalStaff ?? 0}    sub="on your team"     color="text-slate-900" Icon={UserCog} />
          <StatCard label="Total Beds"     value={stats?.totalBeds ?? 0}     sub="across all wards" color="text-slate-900" Icon={Building2} />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <QuickActionCard to="/queue"     Icon={ListOrdered}   title="Manage Queue"     description="Check in patients and call them to the doctor" />
          <QuickActionCard to="/patients"  Icon={Users}         title="Patient Records"  description="Search, view, and update patient profiles" />
          <QuickActionCard to="/beds"      Icon={BedDouble}     title="Bed Management"   description="Assign and discharge patients from beds" />
          <QuickActionCard to="/emergency" Icon={AlertTriangle} title="Emergency / SOS"  description="Emergency contacts and SOS alert" accent="border-red-200 hover:border-red-400" />
          <QuickActionCard to="/consent"   Icon={FileText}      title="Consent Forms"    description="Print patient consent and agreement forms" />
          <QuickActionCard to="/settings"  Icon={Settings}      title="Settings"         description="Manage clinic profile, staff, and beds" />
        </div>
      </div>
    </div>
  );
}
