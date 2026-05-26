import axios from "axios";

const resolveApiBaseUrl = () => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv && String(fromEnv).trim()) {
    const base = String(fromEnv).trim().replace(/\/$/, "");
    return base.endsWith("/api") ? base : `${base}/api`;
  }

  if (typeof window === "undefined") {
    return "http://127.0.0.1:8000/api";
  }

  const hostname = window.location.hostname || "127.0.0.1";
  const normalizedHost = hostname === "localhost" ? "127.0.0.1" : hostname;
  return `http://${normalizedHost}:8000/api`;
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ahp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
