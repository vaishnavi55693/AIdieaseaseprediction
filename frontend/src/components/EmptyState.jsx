import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function EmptyState({ title, description, actionLabel = "Start prediction", actionTo = "/predict" }) {
  return (
    <div className="glass-panel overflow-hidden p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-100 to-sky-100 text-amber-600 dark:from-amber-500/10 dark:to-sky-500/10 dark:text-amber-300">
        <Sparkles className="h-7 w-7" />
      </div>
      <h3 className="mt-6 text-2xl font-bold">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">{description}</p>
      <Link to={actionTo} className="action-button mx-auto mt-6 inline-flex gap-2">
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
