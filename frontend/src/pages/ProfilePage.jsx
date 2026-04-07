import { Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, logout, setUser } = useAuth();
  const [historyCount, setHistoryCount] = useState(0);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    age: user?.age || "",
    gender: user?.gender || "Male",
    height_cm: user?.height_cm || "",
    weight_kg: user?.weight_kg || "",
    medical_history: user?.medical_history || "",
  });

  useEffect(() => {
    api
      .get("/predictions/history/grouped")
      .then(({ data }) => setHistoryCount(data.length))
      .catch(() => setHistoryCount(0));
  }, []);

  useEffect(() => {
    setForm({
      full_name: user?.full_name || "",
      age: user?.age || "",
      gender: user?.gender || "Male",
      height_cm: user?.height_cm || "",
      weight_kg: user?.weight_kg || "",
      medical_history: user?.medical_history || "",
    });
  }, [user]);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      age: form.age ? Number(form.age) : null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
    };
    try {
      const { data } = await api.put("/auth/profile", payload);
      localStorage.setItem("ahp_user", JSON.stringify(data));
      setUser(data);
      setStatus("Profile saved successfully.");
    } catch (error) {
      setStatus(error.response?.data?.detail || "Profile could not be saved.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Profile Page</p>
        <h1 className="mt-3 text-4xl font-bold">Personal account overview</h1>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="glass-panel p-6">
          <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800">
            <div className="mb-5 inline-flex rounded-3xl bg-amber-100 p-4 text-amber-600">
              <UserRound className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold">{user?.full_name}</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{user?.role?.toUpperCase()}</p>
          </div>
          <button onClick={logout} type="button" className="mt-5 action-button w-full">
            Logout
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <Mail className="h-5 w-5 text-amber-500" />
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Email</p>
              <h3 className="mt-2 break-all text-lg font-semibold">{user?.email}</h3>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Prediction History</p>
              <h3 className="mt-2 text-3xl font-bold">{historyCount}</h3>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <UserRound className="h-5 w-5 text-amber-500" />
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Status</p>
              <h3 className="mt-2 text-lg font-semibold">Active account</h3>
            </div>
          </div>

          <form onSubmit={saveProfile} className="glass-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Edit profile</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Save your health profile to prefill future predictions.</p>
              </div>
              <button type="submit" className="action-button gap-2">
                <Save className="h-4 w-4" />
                Save Profile
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input className="input-shell" placeholder="Full Name" value={form.full_name} onChange={(event) => updateField("full_name", event.target.value)} required />
              <input className="input-shell" type="number" placeholder="Age" value={form.age} onChange={(event) => updateField("age", event.target.value)} />
              <select className="input-shell" value={form.gender} onChange={(event) => updateField("gender", event.target.value)}>
                <option>Male</option>
                <option>Female</option>
              </select>
              <input className="input-shell" type="number" placeholder="Height (cm)" value={form.height_cm} onChange={(event) => updateField("height_cm", event.target.value)} />
              <input className="input-shell" type="number" placeholder="Weight (kg)" value={form.weight_kg} onChange={(event) => updateField("weight_kg", event.target.value)} />
              <textarea className="input-shell min-h-32 md:col-span-2" placeholder="Medical history" value={form.medical_history} onChange={(event) => updateField("medical_history", event.target.value)} />
            </div>
            {status && <p className="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">{status}</p>}
          </form>
        </div>
      </section>
    </div>
  );
}
