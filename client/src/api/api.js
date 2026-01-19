// src/api/api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;          // напр. https://xxx.up.railway.app
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";

function normalizeOrigin(url) {
  return String(url || "").replace(/\/+$/, "");
}
function normalizePrefix(p) {
  const s = String(p || "/api").trim();
  if (!s) return "/api";
  return s.startsWith("/") ? s.replace(/\/+$/, "") : `/${s.replace(/\/+$/, "")}`;
}

if (!API_URL) {
  throw new Error("Missing VITE_API_URL in client/.env");
}

const baseURL = `${normalizeOrigin(API_URL)}${normalizePrefix(API_PREFIX)}`;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Додаємо токен із localStorage в заголовки
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
