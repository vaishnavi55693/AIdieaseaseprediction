const healthScoreStyles = {
  "Good Health": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "Moderate Risk": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "High Risk": "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export default function HealthScoreBadge({ status }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${healthScoreStyles[status] || healthScoreStyles["Moderate Risk"]}`}>
      {status}
    </span>
  );
}
