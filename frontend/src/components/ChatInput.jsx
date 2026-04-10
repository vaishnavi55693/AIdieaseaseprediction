import { SendHorizonal, Trash2 } from "lucide-react";

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onClear,
  disabled,
  suggestions,
  onSuggestionClick,
}) {
  return (
    <div className="border-t border-slate-200 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
      <div className="mb-3 flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSuggestionClick(item)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:bg-sky-500/10 dark:hover:text-sky-200"
          >
            {item}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={1}
          placeholder="Ask about diabetes, BMI, diet, exercise, or health risks..."
          className="input-shell min-h-[52px] resize-none rounded-3xl"
        />
        <button
          type="button"
          onClick={onClear}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Clear chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-400"
          aria-label="Send message"
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
