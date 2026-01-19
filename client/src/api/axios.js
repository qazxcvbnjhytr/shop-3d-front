import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "";

const normalizeOrigin = (url) => String(url || "").replace(/\/+$/, "");
const normalizePrefix = (p) => {
  const s = String(p || "").trim();
  if (!s) return "";
  return s.startsWith("/") ? s.replace(/\/+$/, "") : `/${s.replace(/\/+$/, "")}`;
};

if (!API_URL) {
  throw new Error("Missing VITE_API_URL in client/.env");
}

const baseURL = `${normalizeOrigin(API_URL)}${normalizePrefix(API_PREFIX)}`;

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
