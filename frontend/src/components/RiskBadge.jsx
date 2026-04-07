const riskStyles = {
  "High Risk": "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "Medium Risk": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "Low Risk": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

export default function RiskBadge({ level }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskStyles[level] || riskStyles["Medium Risk"]}`}>{level}</span>;
}
