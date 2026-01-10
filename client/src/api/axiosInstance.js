// client/src/api/axiosInstance.js
import axios from "axios";

const RAW = import.meta.env.VITE_API_URL || "http://localhost:5000";

// прибираємо кінцеві "/" і "/api" якщо хтось вписав VITE_API_URL як ".../api"
const normalizeBase = (raw) => {
  const s = String(raw || "").replace(/\/+$/, "");
  return s.replace(/\/api\/?$/, "");
};

const BASE = normalizeBase(RAW);

const axiosInstance = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosInstance;
