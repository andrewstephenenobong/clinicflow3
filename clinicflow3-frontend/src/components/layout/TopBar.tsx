import type { Clinic } from "../../types";

interface TopBarProps {
  clinic: Clinic;
}

export function TopBar({ clinic }: TopBarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-sm font-medium text-slate-700">{clinic.name}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{clinic.address}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">Reception</p>
          <p className="text-xs text-slate-500">Receptionist</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
          R
        </div>
      </div>
    </header>
  );
}
