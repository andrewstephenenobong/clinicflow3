import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  Icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

// Standard empty state used across list/table pages so messaging looks
// consistent instead of each page inventing its own copy and spacing.
export function EmptyState({ Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-5 py-14">
      <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Icon size={18} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
