import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function ChartCard({ title, children }) {
  return (
    <div className="glass-panel p-5">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <div className="mt-4 h-72">{children}</div>
    </div>
  );
}

export function DiseaseRiskBarChart({ data }) {
  return (
    <ChartCard title="Disease Risk Bar Chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
          <XAxis dataKey="disease" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip />
          <Bar dataKey="risk_score" fill="#facc15" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function HealthScoreProgressChart({ data }) {
  return (
    <ChartCard title="Health Score Progress Chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
          <XAxis dataKey="label" stroke="#64748b" />
          <YAxis stroke="#64748b" domain={[0, 100]} />
          <Tooltip />
          <Area type="monotone" dataKey="health_score" stroke="#38bdf8" fill="#bae6fd" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PredictionHistoryChart({ data }) {
  return (
    <ChartCard title="Prediction History Chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
          <XAxis dataKey="label" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip />
          <Line type="monotone" dataKey="high_risk_count" stroke="#fb7185" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
