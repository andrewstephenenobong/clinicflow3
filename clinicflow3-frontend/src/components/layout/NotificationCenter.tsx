import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { SAMPLE_NOTIFICATIONS, CHANNEL_META } from "../../data/notifications";

// Notification center UI shell — cards are pre-built for every channel type
// (SMS, email, internal, appointment, emergency, patient called, bed
// assigned, lab result). No backend notification feed exists yet.
// TODO(backend): wire to GET /api/notifications when available; currently
// renders sample data so the layout and interactions are ready.
export function NotificationCenter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(SAMPLE_NOTIFICATIONS);

  const unreadCount = items.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        className="relative w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg max-h-[26rem] overflow-y-auto">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => setItems((cur) => cur.map((n) => ({ ...n, read: true })))}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((n) => {
                const meta = CHANNEL_META[n.channel];
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                        !n.read ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                        <meta.Icon size={13} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-900 truncate">{n.title}</span>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />}
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">{n.detail}</span>
                        <span className="block text-[11px] text-slate-400 mt-1">{n.time} · {meta.label}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
