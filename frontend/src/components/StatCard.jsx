export default function StatCard({ label, value, accent = "from-[#fff8cc] to-[#fffdf1]" }) {
  return (
    <div className={`rounded-[26px] border border-slate-200 bg-gradient-to-br ${accent} p-5`}>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <h3 className="mt-4 text-3xl font-bold text-slate-900">{value}</h3>
    </div>
  );
}
