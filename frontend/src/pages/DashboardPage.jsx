import { ArrowRight, HeartPulse, ShieldPlus, Sparkles, Waves, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DiseaseRiskBarChart,
  HealthScoreProgressChart,
  PredictionHistoryChart,
} from "../components/DashboardCharts";
import DiseaseCard from "../components/DiseaseCard";
import HealthScoreBadge from "../components/HealthScoreBadge";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../useDashboard";

const diseaseCards = [
  { title: "Heart Disease Prediction", icon: "🫀", description: "Cardiovascular risk intelligence powered by ensemble models." },
  { title: "Diabetes Prediction", icon: "🍬", description: "Metabolic pattern analysis with glucose and lifestyle insights." },
  { title: "Kidney Disease Prediction", icon: "🧪", description: "Renal risk profiling using key lab and symptom signals." },
  { title: "Lung Disease Prediction", icon: "🫁", description: "Respiratory screening for smoking and breath-related indicators." },
  { title: "Liver Disease Prediction", icon: "🧬", description: "Lifestyle-led liver risk scoring with ensemble model confidence." },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data } = useDashboard();

  return (
    <div className="space-y-6">
      <section className="glass-panel relative overflow-hidden bg-gradient-to-r from-[#fffdf5] to-[#f4fbff] p-6 dark:from-slate-900 dark:to-slate-800 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_20%),radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.16),transparent_20%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Welcome to AI Health Predictor</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight">
              {user?.full_name}, your modern health command center is ready.
            </h1>
            <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-300">
              Explore intelligent risk prediction, previous assessments, and guided next steps in one elegant workspace.
            </p>
            <div className="mt-4">
              <HealthScoreBadge status={data?.quick_stats?.health_status || "Good Health"} />
            </div>
          </div>
          <Link to="/predict" className="action-button gap-2 self-start lg:self-auto">
            Quick Predict
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Health Score Card" value={data?.quick_stats?.average_health_score ?? 92} accent="from-[#fff7bf] to-[#fffbea]" />
        <StatCard label="Previous Predictions" value={data?.quick_stats?.total_predictions ?? 0} accent="from-white to-slate-50" />
        <StatCard label="High Risk Alerts" value={data?.quick_stats?.high_risk_count ?? 0} accent="from-[#ffe4e6] to-[#fff1f2]" />
        <StatCard label="Health Status" value={data?.quick_stats?.health_status ?? "Good Health"} accent="from-[#fef9c3] to-[#ecfeff]" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {diseaseCards.map((card) => (
            <DiseaseCard key={card.title} {...card} />
          ))}
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold">Daily Guidance</h3>
            <div className="mt-5 space-y-3">
              {[
                { icon: HeartPulse, label: "Track vitals weekly for stronger model confidence." },
                { icon: Waves, label: "Hydration and sleep consistency improve baseline wellness." },
                { icon: ShieldPlus, label: "Preventive screening is most effective before symptoms escalate." },
                { icon: Sparkles, label: "Use the quick predict flow after any lifestyle or symptom change." },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                  <Icon className="mt-0.5 h-4 w-4 text-amber-500" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Top detected risk</p>
                <h3 className="text-xl font-semibold">{data?.top_risks?.[0]?.disease ?? "No predictions yet"}</h3>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Highest recorded risk score: {data?.top_risks?.[0]?.risk_score?.toFixed?.(1) ?? "0.0"}%
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <DiseaseRiskBarChart data={data?.charts?.risk_bar_chart ?? []} />
        <HealthScoreProgressChart data={data?.charts?.health_score_progress ?? []} />
        <PredictionHistoryChart data={data?.charts?.prediction_history_chart ?? []} />
      </section>
    </div>
  );
}
