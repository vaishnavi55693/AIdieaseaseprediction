import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import HealthScoreBadge from "../components/HealthScoreBadge";
import PageTransition from "../components/PageTransition";
import RiskBadge from "../components/RiskBadge";
import api from "../api/client";

export default function HistoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/predictions/history/grouped")
      .then(({ data }) => setRows(data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const highestRiskRecorded = rows.length
    ? Math.max(...rows.map((entry) => Number(entry.highest_risk_score || 0)))
    : 0;

  return (
    <PageTransition>
      <div className="space-y-6">
      <section className="glass-panel p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Prediction History</p>
        <h1 className="mt-3 text-4xl font-bold">Track your past health predictions</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Every AI check is stored with date, risk level, and health score for easy review and follow-up.
        </p>
      </section>

      {loading ? (
        <section className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="glass-panel h-40 animate-pulse p-6" />
          ))}
        </section>
      ) : rows.length ? (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="premium-card p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">History Entries</p>
            <h3 className="mt-3 text-3xl font-bold">{rows.length}</h3>
          </div>
          <div className="premium-card p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">Highest Risk Recorded</p>
            <h3 className="mt-3 text-3xl font-bold">{highestRiskRecorded.toFixed(1)}%</h3>
          </div>
          <div className="premium-card p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">Latest Health Status</p>
            <div className="mt-3">
              <HealthScoreBadge status={rows[0]?.health_status} />
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4">
        {rows.length === 0 ? (
          loading ? null : (
            <EmptyState
              title="No prediction timeline yet"
              description="Your history page will capture health progression, peak risks, and screening improvement once you complete at least one intelligent health assessment."
            />
          )
        ) : (
          rows.map((entry, index) => (
            <motion.article
              key={entry.prediction_group_id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.03 }}
              className="premium-card p-6"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(entry.date).toLocaleString()}</p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Health Score {entry.health_score}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{entry.trend_summary}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <HealthScoreBadge status={entry.health_status} />
                  {entry.wellness_badge ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {entry.wellness_badge}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Top risk</p>
                  <p className="mt-2 font-semibold">{entry.top_risk_disease || "N/A"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Peak recorded risk</p>
                  <p className="mt-2 font-semibold">{Number(entry.highest_risk_score || 0).toFixed(1)}%</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Improvement lens</p>
                  <p className="mt-2 font-semibold">{entry.health_score >= 80 ? "Stable progress" : entry.health_score >= 55 ? "Needs consistency" : "High attention needed"}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {entry.disease_results.map((disease) => (
                  <div key={`${entry.prediction_group_id}-${disease.disease}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{disease.disease}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{disease.risk_score.toFixed(1)}%</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <RiskBadge level={disease.risk_level} />
                      {disease.severity_badge ? (
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          {disease.severity_badge}
                        </span>
                      ) : null}
                    </div>
                    {disease.contributing_factors?.length ? (
                      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {disease.contributing_factors.slice(0, 2).join(", ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </motion.article>
          ))
        )}
      </section>
      </div>
    </PageTransition>
  );
}
