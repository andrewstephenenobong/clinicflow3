import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  leaving: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// How long the exit animation takes — must match the "slide-out" keyframe
// duration in tailwind.config.js so the toast unmounts right as it fades out.
const EXIT_ANIMATION_MS = 180;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    // Mark as leaving first so it plays the exit animation, then remove
    // it from state once the animation has actually finished.
    setToasts((current) => current.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((current) => [...current, { id, message, type, leaving: false }]);

    setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  const styles: Record<ToastType, { bg: string; icon: ReactNode; iconBg: string }> = {
    success: { bg: "bg-emerald-600", iconBg: "bg-emerald-500/40", icon: <CheckCircle2 size={16} /> },
    error:   { bg: "bg-red-600",     iconBg: "bg-red-500/40",     icon: <XCircle size={16} /> },
    info:    { bg: "bg-blue-600",    iconBg: "bg-blue-500/40",    icon: <Info size={16} /> },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const s = styles[toast.type];
          return (
            <div
              key={toast.id}
              role="status"
              onClick={() => dismiss(toast.id)}
              className={`
                flex items-center gap-2.5
                pl-3 pr-4 py-3 rounded-lg shadow-lg hover:shadow-xl text-sm font-medium text-white
                pointer-events-auto max-w-sm cursor-pointer
                transition-shadow duration-150
                ${toast.leaving ? "animate-slide-out" : "animate-slide-in"}
                ${s.bg}
              `}
            >
              <span className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 animate-pop-in ${s.iconBg}`}>
                {s.icon}
              </span>
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is tightly coupled to ToastProvider's context; pre-existing pattern, not part of this pass's scope.
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
