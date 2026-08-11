import { CheckCircle2, Circle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TimelineStage =
  | "Registered"
  | "Checked In"
  | "Waiting"
  | "Called"
  | "Seen"
  | "Admitted"
  | "Discharged"
  | "Follow-up";

export interface TimelineEvent {
  stage: TimelineStage;
  timestamp: string | null; // null = not reached yet
  note?: string;
}

const STAGE_ORDER: TimelineStage[] = [
  "Registered",
  "Checked In",
  "Waiting",
  "Called",
  "Seen",
  "Admitted",
  "Discharged",
  "Follow-up",
];

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString([], {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

// Renders a clean vertical timeline of a patient's journey through the
// clinic. Backend events for every stage don't all exist yet (e.g.
// "Follow-up" has no API support), so any stage without a timestamp renders
// as an upcoming/greyed-out step — the UI works today and lights up further
// automatically once more events are recorded.
// TODO(backend): surface Follow-up scheduling once that feature exists.
export function PatientTimeline({ events }: { events: TimelineEvent[] }) {
  const byStage = new Map(events.map((e) => [e.stage, e]));

  return (
    <ol className="space-y-0">
      {STAGE_ORDER.map((stage, i) => {
        const event = byStage.get(stage);
        const reached = !!event?.timestamp;
        const isLast = i === STAGE_ORDER.length - 1;
        const Icon: LucideIcon = reached ? CheckCircle2 : Circle;

        return (
          <li key={stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Icon
                size={16}
                className={reached ? "text-emerald-600" : "text-slate-300"}
                aria-hidden="true"
              />
              {!isLast && (
                <span className={`w-px flex-1 min-h-[1.25rem] ${reached ? "bg-emerald-200" : "bg-slate-200"}`} />
              )}
            </div>
            <div className="pb-4">
              <p className={`text-sm font-medium ${reached ? "text-slate-900" : "text-slate-400"}`}>
                {stage}
              </p>
              {event?.timestamp ? (
                <p className="text-xs text-slate-500 mt-0.5">{formatTimestamp(event.timestamp)}</p>
              ) : (
                <p className="text-xs text-slate-300 mt-0.5">Not yet reached</p>
              )}
              {event?.note && <p className="text-xs text-slate-600 mt-0.5">{event.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
