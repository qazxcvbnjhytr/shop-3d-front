// client/src/admin/api/adminApi.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const adminApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Если у тебя JWT в localStorage — подхватим (не мешает cookie-сессии)
adminApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt");

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (r) => r,
  (err) => {
    // более понятные ошибки
    if (err?.response) {
      const msg = err.response?.data?.message || err.response.statusText;
      err.friendlyMessage = `${err.response.status}: ${msg}`;
    } else {
      err.friendlyMessage = "Network error (сервер недоступен или CORS)";
    }
    return Promise.reject(err);
  }
);

export { API_URL };
