import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const distributionColors = ["#fb7185", "#f59e0b", "#22c55e"];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-900">
      {label ? <p className="font-semibold text-slate-800 dark:text-slate-100">{label}</p> : null}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-1 text-slate-600 dark:text-slate-300">
          {entry.name || entry.dataKey}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="premium-card p-5">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      <div className="mt-4 h-72">{children}</div>
    </div>
  );
}

export function DiseaseRiskBarChart({ data }) {
  return (
    <ChartCard title="Disease Risk Comparison" subtitle="Compare the highest disease risks identified across your prediction history.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
          <XAxis dataKey="disease" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="risk_score" fill="#facc15" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function HealthScoreProgressChart({ data }) {
  return (
    <ChartCard title="Health Score Progress" subtitle="Track how your overall health score changes over successive screenings.">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
          <XAxis dataKey="label" stroke="#64748b" />
          <YAxis stroke="#64748b" domain={[0, 100]} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="health_score" stroke="#38bdf8" fill="#bae6fd" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PredictionHistoryChart({ data }) {
  return (
    <ChartCard title="Prediction Risk Timeline" subtitle="Monitor how often high-risk disease flags appear over time.">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
          <XAxis dataKey="label" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip content={<ChartTooltip />} />
          <Line type="monotone" dataKey="high_risk_count" stroke="#fb7185" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RiskDistributionChart({ data }) {
  return (
    <ChartCard title="Risk Distribution" subtitle="See the balance between low, medium, and high-risk disease outputs.">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={68} outerRadius={108} paddingAngle={4}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={distributionColors[index % distributionColors.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
