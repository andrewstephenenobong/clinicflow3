import { useQuery } from "@tanstack/react-query";
import { bedApi } from "../services/api";

// Turns an admittedAt timestamp into a human "how long admitted" string.
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

export function AdmittedPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["beds", "admitted"],
    queryFn: () => bedApi.admitted(),
  });

  const beds = data?.beds ?? [];

  // Group by ward, same as the Beds page, for a real ward-round feel.
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
                    <li key={bed.id} className="flex items-center justify-between px-5 py-4">
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
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
