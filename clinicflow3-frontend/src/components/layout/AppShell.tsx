import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { mockVisits } from "../../data/mockVisits";
import { mockBeds, type Bed } from "../../data/mockBeds";
import type { Visit } from "../../types";

// The context we expose to all child pages via Outlet.
// Any page can call useOutletContext<ClinicContext>() to get this.
export interface ClinicContext {
  visits: Visit[];
  setVisits: React.Dispatch<React.SetStateAction<Visit[]>>;
  beds: Bed[];
  setBeds: React.Dispatch<React.SetStateAction<Bed[]>>;
}

export function AppShell() {
  // The single source of truth for the whole app's data.
  // When we wire the backend, this becomes useQuery() calls — same shape.
  const [visits, setVisits] = useState<Visit[]>(mockVisits);
  const [beds, setBeds] = useState<Bed[]>(mockBeds);

  const ctx: ClinicContext = { visits, setVisits, beds, setBeds };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet context={ctx} />
        </main>
      </div>
    </div>
  );
}
