import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BedDouble,
  ClipboardList,
  AlertTriangle,
  MessageSquare,
  Stethoscope,
  FileText,
  HelpCircle,
  Settings,
  ListOrdered,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
  section?: string;
}

export function Sidebar() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";

  const navItems: NavItem[] = [
    ...(isAdmin ? [{ to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, section: "Operations" }] : []),
    { to: "/queue",     label: "Queue",              Icon: ListOrdered,    section: "Operations" },
    { to: "/patients",  label: "Patients",           Icon: Users,          section: "Operations" },
    { to: "/beds",      label: "Beds",               Icon: BedDouble,      section: "Operations" },
    { to: "/admitted",  label: "Admitted",           Icon: ClipboardList,  section: "Operations" },
    { to: "/emergency", label: "Emergency",          Icon: AlertTriangle,  section: "Quick Access" },
    { to: "/chat",      label: "Doctor–Patient Chat",Icon: MessageSquare,  section: "Quick Access" },
    { to: "/portal",    label: "Patient Portal",     Icon: Stethoscope,    section: "Patient Services" },
    { to: "/consent",   label: "Consent Forms",      Icon: FileText,       section: "Patient Services" },
    { to: "/support",   label: "Help & Support",     Icon: HelpCircle,     section: "System" },
    { to: "/settings",  label: "Settings",           Icon: Settings,       section: "System" },
  ];

  const sections = Array.from(new Set(navItems.map((i) => i.section)));

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-slate-200">
        <h1 className="text-xl font-bold text-blue-600">ClinicFlow</h1>
        <p className="text-xs text-slate-500 mt-0.5">by Andrew Cares</p>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {sections.map((section) => {
          const items = navItems.filter((i) => i.section === section);
          return (
            <div key={section} className="mb-4">
              <p className="px-3 mb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {section}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }: { isActive: boolean }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`
                    }
                  >
                    <item.Icon size={15} className="flex-shrink-0" />
                    <span>{item.label}</span>
                    {item.to === "/emergency" && (
                      <span className="ml-auto text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                        SOS
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-slate-200 text-xs text-slate-400">
        Built with purpose. Made with care. © 2026 Andrew Cares.
      </div>
    </aside>
  );
}
