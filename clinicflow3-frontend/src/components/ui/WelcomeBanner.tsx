import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function WelcomeBanner() {
  const { currentClinic } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-blue-900">
            Welcome to CliniTrax, {currentClinic?.name}
          </h2>
          <p className="text-sm text-blue-700 mt-1">
            You're all set. Here's how to get started in 3 steps.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-400 hover:text-blue-600 ml-4"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="bg-white rounded-lg border border-blue-100 px-4 py-3">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">
            Step 1
          </p>
          <p className="text-sm font-medium text-slate-800">Add your beds</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Set up your ward and bed layout in Settings.
          </p>
          <button
            onClick={() => navigate("/settings")}
            className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
          >
            Go to Settings
          </button>
        </div>

        <div className="bg-white rounded-lg border border-blue-100 px-4 py-3">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">
            Step 2
          </p>
          <p className="text-sm font-medium text-slate-800">Check in your first patient</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Click "Check In Patient" on the Queue page to add them to the queue.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-blue-100 px-4 py-3">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">
            Step 3
          </p>
          <p className="text-sm font-medium text-slate-800">Add your staff</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Invite doctors and receptionists from Settings.
          </p>
          <button
            onClick={() => navigate("/settings")}
            className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
          >
            Go to Settings
          </button>
        </div>
      </div>
    </div>
  );
}
