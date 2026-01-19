// client/src/pages/auth/ResetPasswordPage.jsx
import React, { useMemo, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../../components/styles/LoginPage.css";

const RAW_API = import.meta.env.VITE_API_URL;
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";

const normalizeOrigin = (url) => String(url || "").replace(/\/+$/, "");
const normalizePrefix = (p) => {
  const s = String(p || "/api").trim();
  if (!s) return "/api";
  return s.startsWith("/") ? s.replace(/\/+$/, "") : `/${s.replace(/\/+$/, "")}`;
};

if (!RAW_API) {
  throw new Error("Missing VITE_API_URL in client/.env(.local)");
}

const API_BASE = `${normalizeOrigin(RAW_API)}${normalizePrefix(API_PREFIX)}`; 

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ якщо прийшли зі сторінки forgot-password — підставимо email автоматично
  const initialEmail = useMemo(() => {
    const e = location?.state?.email;
    return typeof e === "string" ? e : "";
  }, [location?.state?.email]);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const endpoint = useMemo(() => `${API_BASE}/auth/reset-password`, []);

  const handleReset = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setMessage("");

      if (!email || !code || !password) {
        setError("Please fill all fields");
        return;
      }

      setLoading(true);
      try {
        const response = await axios.post(
          endpoint,
          {
            email: String(email).trim().toLowerCase(),
            code: String(code).trim(),
            password: String(password),
          },
          { withCredentials: true }
        );

        setMessage(response?.data?.message || "Password reset successful");

        // ✅ редірект на логін з підстановкою email
        setTimeout(() => {
          navigate("/login", { state: { email: String(email).trim().toLowerCase() } });
        }, 1500);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to reset password");
      } finally {
        setLoading(false);
      }
    },
    [email, code, password, endpoint, navigate]
  );

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleReset}>
        <h2>Reset Password</h2>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-message">{message}</div>}

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          autoComplete="email"
        />

        <label>Reset Code</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code from email"
          autoComplete="one-time-code"
        />

        <label>New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          autoComplete="new-password"
        />

        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
