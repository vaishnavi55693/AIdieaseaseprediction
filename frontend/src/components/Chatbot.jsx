import { MessageCircleHeart, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";

const storageKey = "ahp_chat_history";

const defaultSuggestions = [
  "What is diabetes?",
  "How to reduce heart disease risk?",
  "Explain BMI in simple words",
  "Suggest a healthy diet",
];

const initialMessages = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hello, I'm your AI Health Assistant. I can explain diseases, BMI, risk scores, diet, exercise, and healthier lifestyle habits.",
  },
];

export default function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState(defaultSuggestions);
  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return initialMessages;
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length ? parsed : initialMessages;
    } catch {
      return initialMessages;
    }
  });
  const viewportRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!viewportRef.current) return;
    viewportRef.current.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping, isOpen]);

  const displaySuggestions = useMemo(() => suggestions.slice(0, 4), [suggestions]);

  const appendMessage = (message) => {
    setMessages((current) => [...current, message]);
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || isTyping) return;

    setInput("");
    appendMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    });
    setIsTyping(true);

    try {
      const { data } = await api.post("/chat", { message });
      appendMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
      });
      if (Array.isArray(data.suggestions) && data.suggestions.length) {
        setSuggestions(data.suggestions);
      }
    } catch {
      appendMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "I couldn't reach the health assistant right now. Please make sure the backend is running, then try again.",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    setMessages(initialMessages);
    setSuggestions(defaultSuggestions);
    localStorage.removeItem(storageKey);
  };

  const handleSuggestionClick = (question) => {
    setInput(question);
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <div
        className={`origin-bottom-right transition-all duration-300 ${
          isOpen
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0 [&_*]:pointer-events-none"
        }`}
      >
        <div className="glass-panel w-[min(92vw,420px)] overflow-hidden rounded-[30px] border border-slate-200 bg-white/95 shadow-2xl dark:border-slate-700 dark:bg-slate-950/95">
          <div className="bg-[linear-gradient(135deg,#fef3c7_0%,#e0f2fe_48%,#ffffff_100%)] px-5 py-4 dark:bg-[linear-gradient(135deg,#0f172a_0%,#082f49_55%,#111827_100%)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-sky-700/70 dark:text-sky-200/70">AI Assistant</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">Health Chat Support</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Ask about symptoms, BMI, diet, exercise, or disease risks{user?.full_name ? `, ${user.full_name}` : ""}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-white"
                aria-label="Close chatbot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={viewportRef} className="max-h-[430px] space-y-4 overflow-y-auto bg-slate-50/80 px-4 py-4 dark:bg-slate-950/60">
            {messages.map((message) => (
              <ChatMessage key={message.id} role={message.role} content={message.content} />
            ))}
            {isTyping ? <ChatMessage role="assistant" typing content="" /> : null}
          </div>

          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            onClear={handleClear}
            disabled={isTyping}
            suggestions={displaySuggestions}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="pointer-events-auto group flex items-center gap-3 rounded-full bg-slate-900 px-5 py-4 text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400"
        aria-label="Open AI health chatbot"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
          {isOpen ? <X className="h-5 w-5" /> : <MessageCircleHeart className="h-5 w-5" />}
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold">AI Health Assistant</p>
          <p className="text-xs text-white/80">{isOpen ? "Close chat" : "Ask a health question"}</p>
        </div>
        {!isOpen ? <Sparkles className="h-4 w-4 text-amber-300" /> : null}
      </button>
    </div>
  );
}
