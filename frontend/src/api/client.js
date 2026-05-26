import axios from "axios";

const resolveApiBaseUrl = () => {
  return "https://aidieaseaseprediction3.onrender.com/api";
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