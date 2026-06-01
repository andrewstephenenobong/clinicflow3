import type { ReactNode } from "react";

type BadgeVariant = "emergency" | "urgent" | "routine" | "neutral" | "info";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  emergency: "bg-red-100 text-red-700 border border-red-200",
  urgent: "bg-amber-100 text-amber-800 border border-amber-200",
  routine: "bg-slate-100 text-slate-700 border border-slate-200",
  neutral: "bg-slate-100 text-slate-700 border border-slate-200",
  info: "bg-blue-100 text-blue-700 border border-blue-200",
};

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
