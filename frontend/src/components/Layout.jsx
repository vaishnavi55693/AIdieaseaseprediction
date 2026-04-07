import {
  Activity,
  Clock3,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/predict", label: "Predict", icon: Activity },
  { to: "/results", label: "Results", icon: Sparkles },
  { to: "/history", label: "History", icon: Clock3 },
  { to: "/profile", label: "Profile", icon: UserCircle2 },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-hero-mesh px-4 py-5 text-slate-900 dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="glass-panel flex flex-col justify-between p-6">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-700 dark:bg-slate-800 dark:text-sky-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-700/70 dark:text-sky-300/70">AI Care</p>
                <h1 className="text-xl font-bold">Health Predictor</h1>
              </div>
            </div>

            <div className="mb-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
              <h2 className="mt-1 text-lg font-semibold">{user?.full_name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.role?.toUpperCase()}</p>
            </div>

            <div className="mb-8">
              <ThemeToggle />
            </div>

            <nav className="space-y-2">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                      isActive
                        ? "bg-slate-900 text-white shadow-lg"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <main className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
