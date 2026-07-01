import { useState } from "react";

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

export function ChatPage() {
  const [messages] = useState<Message[]>(PLACEHOLDER_MESSAGES);
  const [draft, setDraft] = useState("");

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 9rem)" }}>
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">Doctor–Patient Chat</h1>
        <p className="text-sm text-slate-500 mt-1">
          Secure messaging between clinical staff and patients. (UI placeholder — real-time messaging coming soon)
        </p>
      </div>

      {/* Placeholder notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex-shrink-0">
        <p className="text-xs font-semibold text-amber-800">
          🚧 This is a UI preview only. Messages are not sent or stored.
          Real-time messaging integration is planned for a future release.
        </p>
      </div>

      {/* Conversation threads selector (mock) */}
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

      {/* Chat window */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-0">
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            A
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Amina Bello</p>
            <p className="text-xs text-slate-500">Patient ID: P-00001 · Last seen: 2 min ago</p>
          </div>
        </div>

        {/* Messages */}
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
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-200 flex gap-2 flex-shrink-0">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message… (placeholder — not functional)"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            onClick={() => setDraft("")}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
