import { useEffect, useState } from "react";

const initialState = {
  age: 34,
  gender: "Male",
  height_cm: 172,
  weight_kg: 70,
  blood_pressure: 126,
  glucose_level: 108,
  cholesterol: 182,
  smoking: false,
  alcohol: false,
  physical_activity: "Moderate",
  chest_pain: false,
  fatigue: true,
  shortness_of_breath: false,
  frequent_urination: false,
};

export default function PredictionForm({ onSubmit, submitting, initialValues }) {
  const [form, setForm] = useState({ ...initialState, ...initialValues });
  useEffect(() => {
    setForm((current) => ({ ...current, ...initialValues }));
  }, [initialValues]);
  const bmi = (form.weight_kg / ((form.height_cm / 100) * (form.height_cm / 100))).toFixed(1);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ ...form, bmi });
  };

  const toggleFields = ["smoking", "alcohol", "chest_pain", "fatigue", "shortness_of_breath", "frequent_urination"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["age", "Age", "number"],
          ["height_cm", "Height (cm)", "number"],
          ["weight_kg", "Weight (kg)", "number"],
          ["blood_pressure", "Blood Pressure", "number"],
          ["glucose_level", "Glucose Level", "number"],
          ["cholesterol", "Cholesterol", "number"],
        ].map(([key, label, type]) => (
          <label key={key} className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
            <input
              className="input-shell"
              type={type}
              value={form[key]}
              onChange={(event) => updateField(key, Number(event.target.value))}
              required
            />
          </label>
        ))}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Gender</span>
          <select className="input-shell" value={form.gender} onChange={(event) => updateField("gender", event.target.value)}>
            <option>Male</option>
            <option>Female</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Physical Activity</span>
          <select
            className="input-shell"
            value={form.physical_activity}
            onChange={(event) => updateField("physical_activity", event.target.value)}
          >
            <option>Low</option>
            <option>Moderate</option>
            <option>High</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {toggleFields.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => updateField(key, !form[key])}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              form[key]
                ? "border-amber-300 bg-amber-50 text-slate-900"
                : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            <p className="text-sm font-medium capitalize">{key.replaceAll("_", " ")}</p>
            <p className="mt-1 text-xs">{form[key] ? "Yes" : "No"}</p>
          </button>
        ))}

        <div className="rounded-[28px] border border-amber-300 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-700">Auto calculated BMI</p>
          <p className="mt-3 text-4xl font-bold text-slate-900">{bmi}</p>
        </div>
      </div>

      <button type="submit" disabled={submitting} className="action-button w-full">
        {submitting ? "Analyzing health profile..." : "Check Health Status"}
      </button>
    </form>
  );
}
