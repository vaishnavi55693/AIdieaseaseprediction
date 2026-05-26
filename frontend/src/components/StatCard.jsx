export default function StatCard({ label, value, accent = "from-[#fff8cc] to-[#fffdf1]" }) {
  return (
    <div className={`premium-card bg-gradient-to-br ${accent} p-5 hover:-translate-y-1`}>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
      <h3 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">{value}</h3>
    </div>
  );
}
