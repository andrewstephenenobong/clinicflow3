import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function Sidebar() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";

  const navItems = [
    ...(isAdmin ? [{ to: "/dashboard", label: "Dashboard" }] : []),
    { to: "/queue", label: "Queue" },
    { to: "/patients", label: "Patients" },
    { to: "/beds", label: "Beds" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
      <div className="px-6 py-5 border-b border-slate-200">
        <h1 className="text-xl font-bold text-blue-600">ClinicFlow</h1>
        <p className="text-xs text-slate-500 mt-0.5">by Kairos Labs</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }: { isActive: boolean }) =>
              `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-slate-200 text-xs text-slate-400">
        Built with purpose. Made with care. © 2026 Kairos Labs.
      </div>
    </aside>
  );
}
