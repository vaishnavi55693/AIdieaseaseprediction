import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import PredictionForm from "../components/PredictionForm";
import { useAuth } from "../context/AuthContext";

function extractErrorMessage(err) {
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const firstIssue = detail[0];
    if (typeof firstIssue?.msg === "string") {
      return firstIssue.msg;
    }
  }
  return err.message || "Prediction could not be completed.";
}

export default function PredictionPage() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const initialValues = useMemo(
    () => ({
      age: user?.age || 34,
      gender: user?.gender || "Male",
      height_cm: user?.height_cm || 172,
      weight_kg: user?.weight_kg || 70,
    }),
    [user]
  );

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/predictions/check", values);
      localStorage.setItem("ahp_latest_results", JSON.stringify(data));
      navigate("/results");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Health Prediction Page</p>
        <h1 className="mt-3 text-4xl font-bold">Patient profile and symptom screening</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Enter core measurements, lifestyle factors, and symptoms. BMI is calculated automatically and sent to the AI
          prediction module for all supported diseases.
        </p>
      </section>

      <section className="glass-panel p-6">
        <PredictionForm onSubmit={handleSubmit} submitting={submitting} initialValues={initialValues} />
        {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}
      </section>
    </div>
  );
}
