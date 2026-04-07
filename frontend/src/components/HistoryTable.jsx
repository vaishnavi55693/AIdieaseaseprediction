const badgeStyles = {
  "High Risk": "bg-rose-100 text-rose-700",
  "Medium Risk": "bg-amber-100 text-amber-700",
  "Low Risk": "bg-emerald-100 text-emerald-700",
};

export default function HistoryTable({ rows }) {
  return (
    <div className="glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
            <tr>
              <th className="px-5 py-4 font-medium">Disease</th>
              <th className="px-5 py-4 font-medium">Risk</th>
              <th className="px-5 py-4 font-medium">Health Score</th>
              <th className="px-5 py-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="px-5 py-4 text-slate-900">{row.disease_type}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[row.risk_level]}`}>
                    {row.risk_level} ({row.risk_score.toFixed(1)}%)
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-700">{row.health_score.toFixed(1)}</td>
                <td className="px-5 py-4 text-slate-500">{new Date(row.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
