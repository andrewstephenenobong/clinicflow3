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

  // Get first letter of user's name for the avatar
  const avatarLetter = currentUser?.name?.[0]?.toUpperCase() ?? "?";

  // Format role for display
  const roleLabel: Record<string, string> = {
    ADMIN: "Admin",
    DOCTOR: "Doctor",
    RECEPTIONIST: "Receptionist",
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Clinic name + address */}
      <div>
        <h2 className="text-sm font-medium text-slate-700">{clinic.name}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{clinic.address}</p>
      </div>

      {/* User info + logout */}
      <div className="flex items-center gap-3">
        {/* Name + role */}
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">
            {currentUser?.name ?? "Unknown"}
          </p>
          <p className="text-xs text-slate-500">
            {currentUser ? roleLabel[currentUser.role] ?? currentUser.role : ""}
          </p>
        </div>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
          {avatarLetter}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-red-600 transition-colors duration-150 ml-1"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
