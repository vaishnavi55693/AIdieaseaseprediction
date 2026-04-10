import { Bot, UserRound } from "lucide-react";

export default function ChatMessage({ role, content, typing = false }) {
  const isUser = role === "user";

  return (
    <div className={`flex items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-slate-800 dark:text-sky-300">
          <Bot className="h-4 w-4" />
        </div>
      ) : null}

      <div
        className={`max-w-[85%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm transition-colors ${
          isUser
            ? "rounded-br-md bg-slate-900 text-white dark:bg-sky-500"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        }`}
      >
        {typing ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-current" />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
      </div>

      {isUser ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <UserRound className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  );
}
