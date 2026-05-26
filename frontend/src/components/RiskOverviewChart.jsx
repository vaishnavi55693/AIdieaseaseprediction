import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const colors = ["#facc15", "#38bdf8", "#fb7185", "#34d399", "#a78bfa"];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-900">
      {label ? <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p> : null}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-1 text-slate-600 dark:text-slate-300">
          {entry.name || entry.dataKey}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export function RiskBarChart({ data }) {
  return (
    <div className="premium-card p-5">
      <h3 className="text-lg font-semibold">Disease Risk Percentage</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Compare realistic disease risk across the latest AI screening.</p>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="disease" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="probability" fill="#facc15" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RiskPieChart({ data }) {
  return (
    <div className="premium-card p-5">
      <h3 className="text-lg font-semibold">Risk Distribution Analytics</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Visual balance of disease risk contribution in the current screening.</p>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={70} outerRadius={110} dataKey="probability" nameKey="disease">
              {data.map((entry, index) => (
                <Cell key={entry.disease} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
