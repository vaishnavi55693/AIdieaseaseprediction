import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import HealthScoreBadge from "../components/HealthScoreBadge";
import { RiskBarChart, RiskPieChart } from "../components/RiskOverviewChart";
import RiskBadge from "../components/RiskBadge";

const riskClasses = {
  "High Risk": "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30",
  "Medium Risk": "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30",
  "Low Risk": "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30",
};

export default function ResultsPage() {
  const [results, setResults] = useState(() => {
    const stored = localStorage.getItem("ahp_latest_results");
    return stored ? JSON.parse(stored) : null;
  });
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    if (results) return;
    api
      .get("/predictions/latest")
      .then(({ data }) => setResults(data))
      .catch(() => setResults(null));
  }, [results]);

  const healthScore = useMemo(() => {
    if (!results?.overall_health_score) return 0;
    return Number(results.overall_health_score).toFixed(1);
  }, [results]);
  const averageRisk = useMemo(() => {
    if (!results?.results?.length) return 0;
    return (
      results.results.reduce((sum, item) => sum + Number(item.probability || 0), 0) / results.results.length
    ).toFixed(1);
  }, [results]);

  const downloadReport = async () => {
    try {
      setReportError("");
      const response = await api.get(`/predictions/report/${results.prediction_group_id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "ai-health-report.pdf";
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setReportError("Report could not be downloaded right now.");
    }
  };

  if (!results) {
    return (
      <div className="glass-panel p-8">
        <h1 className="text-2xl font-bold">Results Dashboard</h1>
        <p className="mt-3 text-slate-600">No recent prediction found. Run a health check to populate this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="glass-panel p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Results Dashboard</p>
          <h1 className="mt-3 text-4xl font-bold">AI risk insights and health score</h1>
          <div className="mt-4 flex items-center gap-3">
            <HealthScoreBadge status={results.overall_status} />
            <button type="button" onClick={downloadReport} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Download Report
            </button>
          </div>
          {reportError && <p className="mt-3 text-sm font-medium text-rose-600">{reportError}</p>}
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
            Lower disease percentages mean lower risk. Your overall health score is based on the combined disease risks.
            Average disease risk: {averageRisk}%.
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">BMI</p>
              <h2 className="mt-3 text-4xl font-bold">{results.bmi}</h2>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">Health Score</p>
              <h2 className="mt-3 text-4xl font-bold">{healthScore}</h2>
            </div>
          </div>
        </div>

        <RiskBarChart data={results.results} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.results.map((item) => (
            <article key={item.disease} className={`rounded-[28px] border p-5 ${riskClasses[item.risk_level]}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.disease}</p>
                  <h3 className="mt-2 text-3xl font-bold">{item.probability.toFixed(1)}%</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Disease Risk Percentage
                  </p>
                </div>
                <RiskBadge level={item.risk_level} />
              </div>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">Health Score: {item.health_score.toFixed(1)}</p>
              <div className="mt-4 space-y-2">
                {item.recommendations.map((recommendation) => (
                  <p key={recommendation} className="rounded-2xl bg-white p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {recommendation}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <RiskPieChart data={results.results} />
      </section>
    </div>
  );
}
