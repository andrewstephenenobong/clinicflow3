import type { Clinic } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  clinic: Clinic;
}

export function TopBar({ clinic }: TopBarProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const avatarLetter = currentUser?.name?.[0]?.toUpperCase() ?? "?";

  const roleLabel: Record<string, string> = {
    ADMIN: "Admin",
    DOCTOR: "Doctor",
    RECEPTIONIST: "Receptionist",
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
      {/* Clinic name */}
      <h2 className="text-sm font-medium text-slate-700 truncate max-w-[140px] md:max-w-none">
        {clinic.name}
      </h2>

      {/* User info + logout */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Name + role — hidden on mobile */}
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium text-slate-800">
            {currentUser?.name ?? "Unknown"}
          </p>
          <p className="text-xs text-slate-500">
            {currentUser ? roleLabel[currentUser.role] ?? currentUser.role : ""}
          </p>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
          {avatarLetter}
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-red-600 transition-colors duration-150"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
