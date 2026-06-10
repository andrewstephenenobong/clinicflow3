import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { dashboardApi } from "../services/api";
import { WelcomeBanner } from "../components/ui/WelcomeBanner";

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className={`text-4xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export function DashboardPage() {
  const { currentClinic } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => dashboardApi.getStats(),
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

  return (
    <div className="max-w-5xl mx-auto">
      {/* Welcome banner — shows when clinic has no patients yet */}
      {stats?.totalPatients === 0 && <WelcomeBanner />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          {currentClinic?.name} · Today's overview
        </p>
      </div>

      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Today
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Checked in"
          value={stats?.patientsCheckedInToday ?? 0}
          sub="patients today"
          color="text-blue-600"
        />
        <StatCard
          label="Seen"
          value={stats?.patientsSeenToday ?? 0}
          sub="consultations done"
          color="text-emerald-600"
        />
        <StatCard
          label="Beds available"
          value={stats?.availableBeds ?? 0}
          sub={`of ${stats?.totalBeds ?? 0} total`}
          color="text-slate-900"
        />
        <StatCard
          label="Still waiting"
          value={
            (stats?.patientsCheckedInToday ?? 0) -
            (stats?.patientsSeenToday ?? 0)
          }
          sub="in queue"
          color="text-amber-600"
        />
      </div>

      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        All time
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total patients"
          value={stats?.totalPatients ?? 0}
          sub="registered"
          color="text-slate-900"
        />
        <StatCard
          label="Staff members"
          value={stats?.totalStaff ?? 0}
          sub="on your team"
          color="text-slate-900"
        />
        <StatCard
          label="Total beds"
          value={stats?.totalBeds ?? 0}
          sub="across all wards"
          color="text-slate-900"
        />
      </div>

      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Quick actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/queue"
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors"
        >
          <p className="font-semibold text-slate-900">View queue</p>
          <p className="text-xs text-slate-500 mt-1">See today's waiting patients</p>
        </Link>
        <Link
          to="/patients"
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors"
        >
          <p className="font-semibold text-slate-900">Patient records</p>
          <p className="text-xs text-slate-500 mt-1">Search and view all patients</p>
        </Link>
        <Link
          to="/settings"
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors"
        >
          <p className="font-semibold text-slate-900">Settings</p>
          <p className="text-xs text-slate-500 mt-1">Manage staff, beds, and clinic profile</p>
        </Link>
      </div>
    </div>
  );
}