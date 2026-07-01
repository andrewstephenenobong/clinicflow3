import { Mail, Globe, Clock } from "lucide-react";

export function SupportPage() {
  const faqs = [
    {
      q: "How do I register a new patient?",
      a: "Go to the Queue page and click 'Check In Patient'. Search for the patient by name — if they don't exist, you'll be given the option to register them as new.",
    },
    {
      q: "How do I admit a patient to a bed?",
      a: "First mark the patient as seen in the Queue. Then go to the Beds page, click on an available bed, and select the patient from the admit dialog.",
    },
    {
      q: "How do I add or remove staff?",
      a: "Go to Settings > Staff section. Only Admins can add or remove staff members.",
    },
    {
      q: "Why can't I see the Dashboard?",
      a: "The Dashboard is only visible to Admin users. Receptionists and Doctors see the Queue as their landing page.",
    },
    {
      q: "How are emergency triage cases prioritised?",
      a: "The Queue automatically sorts by triage level: EMERGENCY, then URGENT, then ROUTINE. Within the same level, earlier check-in times rank first.",
    },
    {
      q: "What does 'carried over' mean?",
      a: "A carried-over patient checked in on a previous day and was not yet seen. They appear in a separate section at the top of the queue.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Help & Support</h1>
        <p className="text-sm text-slate-500 mt-1">
          Frequently asked questions and support resources for ClinicFlow.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-blue-800 mb-3">Contact Support</p>
        <div className="space-y-2 text-sm text-blue-900">
          <div className="flex items-center gap-2">
            <Mail size={14} className="flex-shrink-0" />
            <a href="mailto:support@clinicflow.ng" className="underline hover:text-blue-700">
              support@clinicflow.ng
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={14} className="flex-shrink-0" />
            <a
              href="https://github.com/andrewstephenenobong/clinicflow3"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-700"
            >
              GitHub — View source / report issues
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="flex-shrink-0" />
            <span>Support hours: Mon–Fri, 8am–6pm WAT</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Frequently Asked Questions
          </h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {faqs.map((faq, i) => (
            <li key={i} className="px-5 py-4">
              <p className="text-sm font-semibold text-slate-900 mb-1">{faq.q}</p>
              <p className="text-sm text-slate-600">{faq.a}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-600">
        <p className="font-semibold text-slate-800 mb-1">About ClinicFlow</p>
        <p>
          Built with purpose for Nigerian healthcare facilities. ClinicFlow manages patient
          queues, admissions, and clinical records with a focus on speed and reliability.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Version 1.0 · by Andrew Cares · Andrew Stephen Enobong
        </p>
      </div>
    </div>
  );
}
