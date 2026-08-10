import type { Clinic } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationCenter } from "./NotificationCenter";
import { ROLE_LABEL } from "../../data/departments";

interface TopBarProps {
  clinic: Clinic;
}

export function TopBar({ clinic }: TopBarProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const avatarLetter = currentUser?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-4 px-4 md:px-6">
      {/* Clinic name */}
      <h2 className="text-sm font-medium text-slate-700 truncate max-w-[110px] sm:max-w-[160px] md:max-w-none flex-shrink-0">
        {clinic.name}
      </h2>

      <GlobalSearch />

      {/* User info + logout */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto flex-shrink-0">
        <NotificationCenter />

        {/* Name + role — hidden on mobile */}
        <div className="hidden md:block text-right">
          <p className="text-sm font-medium text-slate-800">
            {currentUser?.name ?? "Unknown"}
          </p>
          <p className="text-xs text-slate-500">
            {currentUser ? ROLE_LABEL[currentUser.role] ?? currentUser.role : ""}
          </p>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
          {avatarLetter}
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-red-600 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
