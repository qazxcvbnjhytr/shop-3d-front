// client/src/admin/api/adminApi.js
import axios from "axios";

/**
 * ENV:
 *  - VITE_API_URL=https://xxx.up.railway.app   (обов'язково)
 *  - VITE_API_PREFIX=/api                     (опційно, дефолт "/api")
 *  - VITE_ADMIN_PREFIX=/api/admin             (опційно, дефолт "/api/admin")
 */

const RAW_API_URL = import.meta.env.VITE_API_URL;
const RAW_API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";
const RAW_ADMIN_PREFIX = import.meta.env.VITE_ADMIN_PREFIX || "/api/admin";

function normalizeOrigin(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function normalizePrefix(prefix, fallback = "/api") {
  const p = String(prefix || "").trim() || fallback;
  const withSlash = p.startsWith("/") ? p : `/${p}`;
  return withSlash.replace(/\/+$/, "");
}

// ❗ env-first: ніяких fallback на localhost у коді
if (!RAW_API_URL) {
  throw new Error("Missing VITE_API_URL in client/.env(.local)");
}

export const API_ORIGIN = normalizeOrigin(RAW_API_URL);
export const API_PREFIX = normalizePrefix(RAW_API_PREFIX, "/api");
export const ADMIN_PREFIX = normalizePrefix(RAW_ADMIN_PREFIX, "/api/admin");

// Зручні baseURL
export const API_BASE_URL = `${API_ORIGIN}${API_PREFIX}`;
export const ADMIN_BASE_URL = `${API_ORIGIN}${ADMIN_PREFIX}`;

// ---- helpers ----
const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("jwt") ||
  "";

// Щоб зручно показувати повідомлення в UI
export const getFriendlyError = (err) => {
  if (err?.response) {
    const status = err.response.status;
    const msg = err.response?.data?.message || err.response.statusText || "Request error";
    return `${status}: ${msg}`;
  }
  return "Network error (сервер недоступен або CORS)";
};

// ---- instances ----

// ✅ Звичайний API: baseURL = .../api
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ✅ Адмін API: baseURL = .../api/admin
export const adminApi = axios.create({
  baseURL: ADMIN_BASE_URL,
  withCredentials: true,
});

// Підхоплюємо JWT якщо є (не заважає cookie-сесії)
const attachAuth = (config) => {
  const token = getToken();
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachAuth);
adminApi.interceptors.request.use(attachAuth);

// Додаємо friendlyMessage в помилку
const addFriendly = (err) => {
  err.friendlyMessage = getFriendlyError(err);
  return Promise.reject(err);
};

api.interceptors.response.use((r) => r, addFriendly);
adminApi.interceptors.response.use((r) => r, addFriendly);
