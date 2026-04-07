import { HeartPulse, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function AuthShell({ title, subtitle, alternateLink, alternateText, children }) {
  return (
    <div className="min-h-screen bg-hero-mesh px-4 py-8 text-slate-900 dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel hidden overflow-hidden p-8 lg:block">
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-50 p-3 text-sky-700 dark:bg-slate-800 dark:text-sky-300">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-sky-700/70 dark:text-sky-300/70">Future-ready care</p>
                    <h1 className="text-2xl font-bold">AI Health Predictor</h1>
                  </div>
                </div>
                <ThemeToggle />
              </div>

              <h2 className="max-w-lg text-5xl font-extrabold leading-tight">
                Modern AI screening for smarter, calmer health decisions.
              </h2>
              <p className="mt-6 max-w-xl text-base text-slate-600 dark:text-slate-300">
                Inspired by premium social and healthcare experiences, built for secure prediction, elegant analytics,
                and better patient visibility.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                "Multi-disease risk intelligence",
                "Secure JWT authentication",
                "Prediction history and analytics",
                "Responsive dashboard and charts",
              ].map((item) => (
                <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <HeartPulse className="mb-3 h-5 w-5 text-sky-700" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-panel flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-4 flex justify-end lg:hidden">
              <ThemeToggle />
            </div>
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-700/70">Secure access</p>
              <h2 className="mt-3 text-3xl font-bold">{title}</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
            {children}
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              {alternateText}{" "}
              <Link to={alternateLink} className="font-semibold text-sky-700 hover:text-sky-800">
                Continue here
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
