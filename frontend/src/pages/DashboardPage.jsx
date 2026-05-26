import { Link } from "react-router-dom";

export default function DashboardPage() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>AI Health Predictor Dashboard</h1>

      <p>Frontend and backend connected successfully.</p>

      <Link to="/predict">
        Go To Prediction
      </Link>
    </div>
  );
}