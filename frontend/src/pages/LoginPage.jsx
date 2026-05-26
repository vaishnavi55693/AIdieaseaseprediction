import { useState } from "react";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { pushToast } = useToast();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(form);
      pushToast({ type: "success", title: "Welcome back", description: "You have signed in successfully." });
    } catch (err) {
      const message =
        err.code === "ERR_NETWORK" || err.message === "Network Error"
          ? "Unable to connect to server."
          :typeof err.response?.data?.detail === "string"
            ? err.response.data.detail
            : err.message || "Unable to login right now.";
      setError(message);
      pushToast({ type: "error", title: "Login failed", description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to review your dashboard, previous predictions, and personalized AI insights."
      alternateText="New to the platform?"
      alternateLink="/signup"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="input-shell"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          required
        />
        <input
          className="input-shell"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          required
        />
        {error && <p className="text-sm text-rose-200">{error}</p>}
        <button type="submit" className="action-button w-full" disabled={submitting}>
          {submitting ? "Signing in..." : "Login"}
        </button>
      </form>
    </AuthShell>
  );
}
