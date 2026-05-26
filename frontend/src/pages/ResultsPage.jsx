import { motion } from "framer-motion";
import { AlertTriangle, Download, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import EmptyState from "../components/EmptyState";
import HealthScoreBadge from "../components/HealthScoreBadge";
import PageTransition from "../components/PageTransition";
import { RiskBarChart, RiskPieChart } from "../components/RiskOverviewChart";
import RiskBadge from "../components/RiskBadge";
import { useToast } from "../context/ToastContext";

const riskClasses = {
  "High Risk": "border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30",
  "Medium Risk": "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30",
  "Low Risk": "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30",
};

const diseaseLabelMap = {
  heart: "Heart Disease",
  diabetes: "Diabetes",
  kidney: "Kidney Disease",
  lung: "Lung Disease",
  liver: "Liver Disease",
};

function riskLevelFromScore(score) {
  if (score >= 70) return "High Risk";
  if (score >= 40) return "Medium Risk";
  return "Low Risk";
}

function statusFromHealthScore(score) {
  if (score >= 80) return "Good Health";
  if (score >= 50) return "Moderate Risk";
  return "High Risk";
}

export default function ResultsPage() {
  const [results, setResults] = useState(() => {
    const stored = localStorage.getItem("ahp_latest_results");
    return stored ? JSON.parse(stored) : null;
  });
  const [reportError, setReportError] = useState("");
  const { pushToast } = useToast();

  useEffect(() => {
    if (results) return;
    api
      .get("/predictions/latest")
      .then(({ data }) => setResults(data))
      .catch(() => setResults(null));
  }, [results]);

  const diseaseResults = useMemo(() => {
    if (!results) return [];
    if (Array.isArray(results.results) && results.results.length) {
      return results.results;
    }

    const keys = ["heart", "diabetes", "kidney", "lung", "liver"];
    if (!keys.every((key) => typeof results[key] === "number")) {
      return [];
    }

    return keys.map((key) => {
      const probability = Number(results[key]);
        return {
          disease: diseaseLabelMap[key],
          probability,
          confidence: 84,
          risk_level: riskLevelFromScore(probability),
          severity_badge: probability >= 70 ? "Severe" : probability >= 40 ? "Elevated" : "Stable",
          health_score: Number((100 - probability).toFixed(1)),
          contributing_factors: [],
          recommendations: ["Risk estimated from current profile inputs. Recheck regularly after lifestyle changes."],
          summary: "Risk estimated from current profile inputs.",
        };
      });
  }, [results]);

  const healthScore = useMemo(() => {
    if (!results) return 0;
    if (typeof results.health_score === "number") {
      return Number(results.health_score).toFixed(1);
    }
    if (typeof results.overall_health_score === "number") {
      return Number(results.overall_health_score).toFixed(1);
    }
    return 0;
  }, [results]);

  const overallStatus = useMemo(() => {
    if (typeof results?.overall_status === "string") {
      return results.overall_status;
    }
    const score = Number(healthScore || 0);
    return statusFromHealthScore(score);
  }, [results, healthScore]);

  const averageRisk = useMemo(() => {
    if (!diseaseResults.length) return 0;
    return (diseaseResults.reduce((sum, item) => sum + Number(item.probability || 0), 0) / diseaseResults.length).toFixed(1);
  }, [diseaseResults]);

  const downloadReport = async () => {
    try {
      setReportError("");
      const reportPath = results?.prediction_group_id ? `/predictions/report/${results.prediction_group_id}` : "/predictions/report/latest";
      const response = await api.get(reportPath, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "ai-health-report.pdf";
      anchor.click();
      window.URL.revokeObjectURL(url);
      pushToast({ type: "success", title: "Report downloaded", description: "Your AI health report has been generated successfully." });
    } catch (error) {
      setReportError("Report could not be downloaded right now.");
      pushToast({ type: "error", title: "Download failed", description: "The medical report could not be downloaded right now." });
    }
  };

  if (!results) {
    return (
      <PageTransition>
        <EmptyState
          title="No prediction results yet"
          description="Once you run a health screening, this page will transform into your premium clinical-style results dashboard with risk intelligence, confidence scoring, and personalized care recommendations."
        />
      </PageTransition>
    );
  }

  const mostCritical = results?.most_critical_risk || diseaseResults[0];

  return (
    <PageTransition>
      <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="premium-card p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Results Dashboard</p>
          <h1 className="mt-3 text-4xl font-bold">AI risk insights and health score</h1>
          <div className="mt-4 flex items-center gap-3">
            <HealthScoreBadge status={overallStatus} />
            {results?.wellness_badge ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {results.wellness_badge}
              </span>
            ) : null}
            <button type="button" onClick={downloadReport} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <span className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
              Download Report
              </span>
            </button>
          </div>
          {reportError && <p className="mt-3 text-sm font-medium text-rose-600">{reportError}</p>}
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
            {results?.ai_summary || "Lower disease percentages mean lower risk."} Average disease risk: {averageRisk}%.
          </div>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            <span className="font-semibold">Risk trend summary:</span> {results?.risk_trend_summary || "Your overall health score is based on combined disease risk."}
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

        <RiskBarChart data={diseaseResults} />
      </section>

      {mostCritical ? (
        <section className="premium-card overflow-hidden border border-rose-200 p-6 dark:border-rose-900/40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-rose-500">Most Critical Risk</p>
              <h2 className="mt-2 text-3xl font-bold">{mostCritical.disease}</h2>
              <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">{mostCritical.summary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <RiskBadge level={mostCritical.risk_level} />
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                {mostCritical.severity_badge}
              </span>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <p className="font-semibold">Confidence Meter</p>
              </div>
              <p className="mt-3 text-3xl font-bold">{mostCritical.confidence}%</p>
              <div className="metric-bar-track mt-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${mostCritical.confidence}%` }}
                  transition={{ duration: 0.8 }}
                  className="metric-bar-fill bg-gradient-to-r from-sky-400 to-emerald-400"
                />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-500" />
                <p className="font-semibold">Contributing Factors</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(mostCritical.contributing_factors || []).map((factor) => (
                  <span key={factor} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {diseaseResults.map((item) => (
            <article key={item.disease} className={`premium-card border p-5 ${riskClasses[item.risk_level]}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.disease}</p>
                  <h3 className="mt-2 text-3xl font-bold">{item.probability.toFixed(1)}%</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Disease Risk Percentage
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <RiskBadge level={item.risk_level} />
                  <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {item.severity_badge}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    <span>Confidence</span>
                    <span>{item.confidence}%</span>
                  </div>
                  <div className="metric-bar-track">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.confidence}%` }}
                      transition={{ duration: 0.75 }}
                      className="metric-bar-fill bg-gradient-to-r from-sky-400 to-cyan-400"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    <span>Risk Progress</span>
                    <span>{item.probability.toFixed(1)}%</span>
                  </div>
                  <div className="metric-bar-track">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.probability}%` }}
                      transition={{ duration: 0.85 }}
                      className={`metric-bar-fill ${item.risk_level === "High Risk" ? "bg-gradient-to-r from-rose-500 to-rose-400" : item.risk_level === "Medium Risk" ? "bg-gradient-to-r from-amber-400 to-yellow-300" : "bg-gradient-to-r from-emerald-500 to-teal-400"}`}
                    />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">Health Score: {item.health_score.toFixed(1)}</p>
              <p className="mt-3 rounded-2xl bg-white p-3 text-sm leading-6 text-slate-700 dark:bg-slate-900 dark:text-slate-300">{item.summary}</p>
              {(item.contributing_factors || []).length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.contributing_factors.map((factor) => (
                    <span key={factor} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      {factor}
                    </span>
                  ))}
                </div>
              ) : null}
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

        <RiskPieChart data={diseaseResults} />
      </section>
      </div>
    </PageTransition>
  );
}
