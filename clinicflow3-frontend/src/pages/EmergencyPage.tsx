import { useState } from "react";

const EMERGENCY_CONTACTS = [
  {
    category: "Fire Service",
    icon: "🔥",
    color: "red",
    contacts: [
      { name: "Lagos State Fire Service", phone: "01-7944079", note: "24/7 emergency" },
      { name: "Federal Fire Service", phone: "080-13432208", note: "National" },
    ],
  },
  {
    category: "Ambulance / NEMA",
    icon: "🚑",
    color: "rose",
    contacts: [
      { name: "NEMA Emergency Line", phone: "0800-CALL-NEMA", note: "National" },
      { name: "Lagos State Ambulance", phone: "767", note: "Lagos" },
    ],
  },
  {
    category: "Police",
    icon: "🚔",
    color: "blue",
    contacts: [
      { name: "Emergency Police Line", phone: "199", note: "Nationwide" },
      { name: "Police Hotline", phone: "0800-CALL-POLICE", note: "Alternate" },
    ],
  },
  {
    category: "Medical Supply Vendors",
    icon: "💊",
    color: "emerald",
    contacts: [
      { name: "HealthPlus Pharmacy", phone: "0700-HEALTHPLUS", note: "24h delivery" },
      { name: "Medstore Nigeria", phone: "0909-000-0001", note: "Wholesale" },
    ],
  },
  {
    category: "Waste Management",
    icon: "♻️",
    color: "amber",
    contacts: [
      { name: "Lagos Waste Management", phone: "0700-LAWMA-NG", note: "Medical waste" },
      { name: "Enviroserve Nigeria", phone: "0800-111-2222", note: "Hazardous disposal" },
    ],
  },
];

const colorMap: Record<string, { bg: string; border: string; badge: string; badgeText: string }> = {
  red:     { bg: "bg-red-50",     border: "border-red-200",     badge: "bg-red-100",     badgeText: "text-red-700"     },
  rose:    { bg: "bg-rose-50",    border: "border-rose-200",    badge: "bg-rose-100",    badgeText: "text-rose-700"    },
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    badge: "bg-blue-100",    badgeText: "text-blue-700"    },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100", badgeText: "text-emerald-700" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   badge: "bg-amber-100",   badgeText: "text-amber-700"   },
};

export function EmergencyPage() {
  const [sosActive, setSosActive] = useState(false);
  const [sosTimer, setSosTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSOSPress = () => {
    setSosActive(true);
    const t = setTimeout(() => {
      setSosActive(false);
      alert("SOS Alert Triggered! (UI placeholder — backend integration coming soon)");
    }, 3000);
    setSosTimer(t);
  };

  const handleSOSRelease = () => {
    if (sosTimer) clearTimeout(sosTimer);
    setSosActive(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Emergency & Support</h1>
        <p className="text-sm text-slate-500 mt-1">
          SOS alert, emergency contacts, and hospital support resources.
        </p>
      </div>

      {/* SOS Button */}
      <div className="bg-white border border-red-200 rounded-xl p-6 text-center">
        <p className="text-sm font-semibold text-slate-700 mb-1 uppercase tracking-wide">
          SOS Emergency Alert
        </p>
        <p className="text-xs text-slate-500 mb-5">
          Hold the button for 3 seconds to trigger an alert. UI placeholder — backend integration pending.
        </p>
        <button
          onMouseDown={handleSOSPress}
          onMouseUp={handleSOSRelease}
          onTouchStart={handleSOSPress}
          onTouchEnd={handleSOSRelease}
          className={`w-36 h-36 rounded-full text-white font-bold text-xl shadow-lg select-none transition-all duration-200 mx-auto block border-4 ${
            sosActive
              ? "bg-red-700 border-red-900 scale-95 shadow-red-400 shadow-2xl"
              : "bg-red-600 border-red-800 hover:bg-red-700 active:scale-95"
          }`}
        >
          {sosActive ? (
            <span className="animate-pulse">🚨 HOLD...</span>
          ) : (
            <span>🆘 SOS</span>
          )}
        </button>
        {sosActive && (
          <p className="text-sm text-red-700 font-semibold mt-3 animate-pulse">
            Release to cancel · Sending in 3 seconds...
          </p>
        )}
      </div>

      {/* Emergency Contacts */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Emergency & Support Contacts
        </h2>
        <div className="space-y-4">
          {EMERGENCY_CONTACTS.map((section) => {
            const c = colorMap[section.color] ?? colorMap["blue"];
            return (
              <div
                key={section.category}
                className={`${c.bg} ${c.border} border rounded-xl overflow-hidden`}
              >
                <div className={`px-5 py-3 border-b ${c.border}`}>
                  <p className="font-semibold text-slate-800 text-sm">
                    {section.icon} {section.category}
                  </p>
                </div>
                <ul className="divide-y divide-white/60">
                  {section.contacts.map((contact) => (
                    <li
                      key={contact.name}
                      className="px-5 py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{contact.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{contact.note}</p>
                      </div>
                      <a
                        href={`tel:${contact.phone}`}
                        className={`text-sm font-bold ${c.badgeText} ${c.badge} px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity`}
                      >
                        📞 {contact.phone}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
