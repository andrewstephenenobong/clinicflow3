import { useQuery } from "@tanstack/react-query";
import { bedApi } from "../../services/api";

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString([], {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// Shared admission history list — used by both the Patients page profile
// view and the Admitted page slide-over, so bed/ward admission records
// render identically everywhere.
export function AdmissionHistory({ patientId }: { patientId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["patient", patientId, "admissions"],
    queryFn: () => bedApi.admissions(patientId),
  });

  const admissions = data?.admissions ?? [];

  if (isLoading) {
    return <p className="text-xs text-slate-400">Loading admissions…</p>;
  }

  if (admissions.length === 0) {
    return <p className="text-xs text-slate-400">No admissions on record.</p>;
  }

  return (
    <ul className="space-y-2">
      {admissions.map((a) => {
        const isOpen = a.dischargedAt === null;
        return (
          <li
            key={a.id}
            className={`border rounded-md px-3 py-2 ${
              isOpen ? "bg-rose-50 border-rose-200" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">
                Bed {a.bedNumber} · {a.ward} ward
              </p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isOpen ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
              }`}>
                {isOpen ? "Admitted" : "Discharged"}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1">
              In: {formatDateTime(a.admittedAt)}
            </p>
            {a.dischargedAt && (
              <p className="text-xs text-slate-500">
                Out: {formatDateTime(a.dischargedAt)}
              </p>
            )}

            {a.admissionNote && (
              <p className="text-xs text-slate-700 mt-1">
                <span className="font-semibold">Reason: </span>{a.admissionNote}
              </p>
            )}
            {a.dischargeNote && (
              <p className="text-xs text-slate-700 mt-0.5">
                <span className="font-semibold">Condition at discharge: </span>{a.dischargeNote}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
