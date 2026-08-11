import { useEffect, useState } from "react";
import { Paperclip, Mic, Video, Sparkles, Send } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";

interface Message {
  id: string;
  sender: "doctor" | "patient";
  text: string;
  time: string;
}

const PLACEHOLDER_MESSAGES: Message[] = [
  {
    id: "1",
    sender: "doctor",
    text: "Good morning. How are you feeling today compared to your last visit?",
    time: "09:12",
  },
  {
    id: "2",
    sender: "patient",
    text: "Much better, thank you Doctor. The headaches have reduced significantly.",
    time: "09:15",
  },
  {
    id: "3",
    sender: "doctor",
    text: "That's great to hear. Please continue with the prescribed medication and come back in two weeks.",
    time: "09:16",
  },
];

// Messaging is UI-only — there is no chat backend/websocket layer yet.
// TODO(backend): wire to a real-time messaging endpoint (e.g. websockets)
// for sending/receiving; file attachments and voice/video calls need
// dedicated media infrastructure before they can be enabled.
export function ChatPage() {
  const [messages] = useState<Message[]>(PLACEHOLDER_MESSAGES);
  const [draft, setDraft] = useState("");
  const [showTyping, setShowTyping] = useState(false);

  // Simulated typing indicator so the layout/interaction is demonstrable
  // without a real transport. Only the deferred (setTimeout) callback sets
  // state, so the effect body itself stays free of synchronous setState.
  useEffect(() => {
    if (!draft) {
      return;
    }
    const showTimer = setTimeout(() => setShowTyping(true), 0);
    const hideTimer = setTimeout(() => setShowTyping(false), 1500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [draft]);

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 9rem)" }}>
      <div className="mb-4 flex-shrink-0">
        <PageHeader
          title="Doctor–Patient Chat"
          description="Secure messaging between clinical staff and patients."
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex-shrink-0">
        <p className="text-xs font-semibold text-amber-800">
          Preview only. Messages are not sent or stored.
          Real-time messaging integration is planned for a future release.
        </p>
      </div>

      <div className="flex gap-3 mb-4 flex-shrink-0 overflow-x-auto pb-1">
        {["Amina Bello", "Chukwudi Okafor", "Fatima Hassan"].map((name, i) => (
          <button
            key={name}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              i === 0
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
              {name[0]}
            </span>
            {name}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              A
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Amina Bello</p>
              <p className="text-xs text-slate-500 truncate">Patient ID: P-00001 · Last seen: 2 min ago</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              title="AI-assisted triage suggestions (placeholder)"
              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5"
            >
              <Sparkles size={11} />
              AI
            </span>
            <button
              disabled
              title="Voice call is not yet available"
              aria-label="Start voice call"
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 cursor-not-allowed"
            >
              <Mic size={15} />
            </button>
            <button
              disabled
              title="Video call is not yet available"
              aria-label="Start video call"
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 cursor-not-allowed"
            >
              <Video size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "doctor" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.sender === "doctor"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-900 rounded-bl-sm"
                }`}
              >
                <p>{msg.text}</p>
                <p
                  className={`text-xs mt-1 text-right ${
                    msg.sender === "doctor" ? "text-blue-200" : "text-slate-400"
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          ))}

          {showTyping && (
            <div className="flex justify-start" aria-live="polite">
              <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.1s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex items-center gap-2 flex-shrink-0">
          <button
            disabled
            title="File attachments are not yet available"
            aria-label="Attach file"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 cursor-not-allowed flex-shrink-0"
          >
            <Paperclip size={16} />
          </button>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message… (placeholder — not functional)"
            aria-label="Message"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5 flex-shrink-0"
            onClick={() => setDraft("")}
          >
            <Send size={13} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
