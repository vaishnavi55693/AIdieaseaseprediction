import { useState } from "react";
import AuthShell from "../components/AuthShell";
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
  if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
    return "Backend server is not running. Start the backend on 127.0.0.1:8000 and try again.";
  }
  return err.message || "Unable to create your account.";
}

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.full_name.trim().length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await signup(form);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join the platform to access multi-disease prediction, result tracking, and role-based dashboards."
      alternateText="Already have an account?"
      alternateLink="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="input-shell"
          placeholder="Full Name"
          value={form.full_name}
          onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
          required
        />
        <input
          className="input-shell"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            className="input-shell"
            type="password"
            placeholder="Password"
            minLength={8}
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
          <input
            className="input-shell"
            type="password"
            placeholder="Confirm Password"
            minLength={8}
            value={form.confirm_password}
            onChange={(event) => setForm((current) => ({ ...current, confirm_password: event.target.value }))}
            required
          />
        </div>
        <select
          className="input-shell"
          value={form.role}
          onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        {error && <p className="text-sm text-rose-200">{error}</p>}
        <button type="submit" className="action-button w-full" disabled={submitting}>
          {submitting ? "Creating account..." : "Signup"}
        </button>
      </form>
    </AuthShell>
  );
}
