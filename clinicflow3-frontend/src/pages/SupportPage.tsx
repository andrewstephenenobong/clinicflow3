import { useState } from "react";
import { Mail, Globe, Clock, Phone, MessageCircle, Ticket, Send, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../context/ToastContext";

interface SupportTicket {
  id: string;
  subject: string;
  status: "Open" | "Resolved";
  createdAt: string;
}

// Support tickets and feedback are kept in local state — no ticketing
// backend exists yet.
// TODO(backend): add POST /api/support/tickets and GET /api/support/tickets
// once the support desk API is available; live chat needs a real transport
// (e.g. websockets) before it can send/receive messages.
export function SupportPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

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

  const submitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    setTickets((cur) => [
      {
        id: `t-${Date.now()}`,
        subject: subject.trim(),
        status: "Open",
        createdAt: new Date().toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      },
      ...cur,
    ]);
    setSubject("");
    setDetails("");
    showToast("Support ticket submitted");
  };

  const submitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setFeedbackSent(true);
    setFeedback("");
    showToast("Thanks for your feedback");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Customer Care"
        description="Support tickets, live chat, and frequently asked questions."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <a
          href="tel:+2340700000000"
          className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3.5 hover:border-blue-300 transition-colors"
        >
          <Phone size={16} className="text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Call support</p>
            <p className="text-xs text-slate-500">Mon–Fri, 8am–6pm WAT</p>
          </div>
        </a>
        <button
          disabled
          title="Live chat backend is not yet available"
          className="flex items-center gap-3 bg-white border border-dashed border-slate-300 rounded-xl px-4 py-3.5 opacity-60 cursor-not-allowed text-left"
        >
          <MessageCircle size={16} className="text-slate-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-500">Live chat</p>
            <p className="text-xs text-slate-400">Coming soon</p>
          </div>
        </button>
        <a
          href="mailto:support@clinicflow.ng"
          className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3.5 hover:border-blue-300 transition-colors"
        >
          <Mail size={16} className="text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Email us</p>
            <p className="text-xs text-slate-500">support@clinicflow.ng</p>
          </div>
        </a>
      </div>

      {/* Support tickets */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Ticket size={14} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Support tickets
          </h2>
        </div>
        <form onSubmit={submitTicket} className="px-5 py-4 space-y-3 border-b border-slate-200">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Unable to check in a returning patient"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              placeholder="Describe the issue…"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={!subject.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-slate-300"
          >
            <Send size={13} />
            Submit ticket
          </button>
        </form>
        {tickets.length === 0 ? (
          <EmptyState Icon={Ticket} title="No tickets yet" description="Submitted tickets appear here for this session." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <li key={t.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{t.subject}</p>
                  <p className="text-xs text-slate-500">{t.createdAt}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        )}
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

      {/* Feedback form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Feedback</h2>
        {feedbackSent ? (
          <p className="text-sm text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            Feedback received — thank you.
          </p>
        ) : (
          <form onSubmit={submitFeedback} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what could be better…"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!feedback.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-slate-300"
            >
              Send
            </button>
          </form>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-900">
        <p className="font-semibold mb-2 flex items-center gap-1.5">
          <Globe size={14} />
          More resources
        </p>
        <div className="space-y-2 text-sm">
          <a
            href="https://github.com/andrewstephenenobong/clinicflow3"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-700 block"
          >
            GitHub — View source / report issues
          </a>
          <p className="flex items-center gap-2">
            <Clock size={13} />
            Support hours: Mon–Fri, 8am–6pm WAT
          </p>
        </div>
      </div>
    </div>
  );
}
