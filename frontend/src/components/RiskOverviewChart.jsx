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

export function RiskBarChart({ data }) {
  return (
    <div className="glass-panel p-5">
      <h3 className="text-lg font-semibold">Disease Risk Percentage</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Lower percentages indicate lower disease risk.</p>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="disease" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Bar dataKey="probability" fill="#facc15" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RiskPieChart({ data }) {
  return (
    <div className="glass-panel p-5">
      <h3 className="text-lg font-semibold">Pie Chart</h3>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={70} outerRadius={110} dataKey="probability" nameKey="disease">
              {data.map((entry, index) => (
                <Cell key={entry.disease} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
