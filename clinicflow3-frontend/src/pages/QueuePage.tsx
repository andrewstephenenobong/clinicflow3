import { mockVisits } from "../data/mockVisits";
import { Badge } from "../components/ui/Badge";
import type { Triage, VisitStatus } from "../types";

const triageOrder: Record<Triage, number> = {
  EMERGENCY: 0,
  URGENT: 1,
  ROUTINE: 2,
};

function triageVariant(t: Triage) {
  return t === "EMERGENCY" ? "emergency" : t === "URGENT" ? "urgent" : "routine";
}

function statusVariant(s: VisitStatus) {
  return s === "CALLED" ? "info" : "neutral";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function QueuePage() {
  const waiting = mockVisits
    .filter((v) => v.status === "WAITING")
    .sort((a, b) => {
      const t = triageOrder[a.triage] - triageOrder[b.triage];
      return t !== 0 ? t : a.checkedInAt.localeCompare(b.checkedInAt);
    });

  const called = mockVisits.filter((v) => v.status === "CALLED");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Today's Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            {waiting.length} waiting · {called.length} with doctor
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm">
          + Check in patient
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Waiting
          </h2>
        </div>

        <ul className="divide-y divide-slate-100">
          {waiting.map((visit, index) => (
            <li
              key={visit.id}
              className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-sm font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    {visit.patient.name}
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      · {visit.patient.age}{visit.patient.gender}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600 mt-0.5">{visit.reason}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={triageVariant(visit.triage)}>{visit.triage}</Badge>
                <span className="text-xs text-slate-500 w-12 text-right">
                  {formatTime(visit.checkedInAt)}
                </span>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold">
                  Call
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {called.length > 0 && (
        <div className="mt-6 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              With doctor
            </h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {called.map((visit) => (
              <li key={visit.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{visit.patient.name}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{visit.reason}</p>
                </div>
                <Badge variant={statusVariant(visit.status)}>{visit.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
