import { useEffect, useState } from "react";
import HealthScoreBadge from "../components/HealthScoreBadge";
import RiskBadge from "../components/RiskBadge";
import api from "../api/client";

export default function HistoryPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api
      .get("/predictions/history/grouped")
      .then(({ data }) => setRows(data))
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Prediction History</p>
        <h1 className="mt-3 text-4xl font-bold">Track your past health predictions</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Every AI check is stored with date, risk level, and health score for easy review and follow-up.
        </p>
      </section>

      <section className="grid gap-4">
        {rows.length === 0 ? (
          <div className="glass-panel p-6 text-slate-600 dark:text-slate-300">No prediction history yet.</div>
        ) : (
          rows.map((entry) => (
            <article key={entry.prediction_group_id} className="glass-panel p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(entry.date).toLocaleString()}</p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Health Score {entry.health_score}
                  </h3>
                </div>
                <HealthScoreBadge status={entry.health_status} />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {entry.disease_results.map((disease) => (
                  <div key={`${entry.prediction_group_id}-${disease.disease}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{disease.disease}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{disease.risk_score.toFixed(1)}%</p>
                    <div className="mt-3">
                      <RiskBadge level={disease.risk_level} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
