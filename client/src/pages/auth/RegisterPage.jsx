// client/src/pages/auth/RegisterPage.jsx
import React, { useMemo, useState, useContext, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { useAuth } from "../../context/AuthContext.jsx";
import { LanguageContext } from "../../context/LanguageContext";

import "../../components/styles/LoginPage.css";

// ✅ env-first (без localhost fallback)
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

export default function RegisterPage() {
  const { language, translations } = useContext(LanguageContext) || {};
  const t = translations?.[language]?.auth || {};

  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  const [role, setRole] = useState("user");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const endpoint = useMemo(() => `${API_BASE}/auth/register`, []);

  const handleRegister = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (!name || !email || !password) {
        setError(t.fillAllFields || "Please fill all fields");
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            password: String(password),
            role: String(role || "user"),
          }),
          credentials: "include",
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || t.registerFailed || "Registration failed");

        // ✅ після реєстрації автоматично логін
        await login(email, password);

        // ✅ редірект залежно від ролі
        if (role === "admin") navigate("/admin/dashboard");
        else navigate("/account");
      } catch (err) {
        setError(err?.message || t.registerFailed || "Registration failed");
      } finally {
        setLoading(false);
      }
    },
    [name, email, password, role, t, login, navigate, endpoint]
  );

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleRegister}>
        <h2>{t.register || "Register"}</h2>
        {error && <div className="auth-error">{error}</div>}

        <label htmlFor="name">{t.name || "Name"}</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder || "Enter your name"}
          autoComplete="name"
        />

        <label htmlFor="email">{t.email || "Email"}</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder || "Enter your email"}
          autoComplete="email"
        />

        <label htmlFor="password">{t.password || "Password"}</label>
        <div className="password-wrapper" style={{ position: "relative" }}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.passwordPlaceholder || "Enter your password"}
            autoComplete="new-password"
            style={{ paddingRight: "35px" }}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: "#555",
              background: "transparent",
              border: "none",
              padding: 0,
              lineHeight: 0,
            }}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* ⚠️ тестовий вибір ролі */}
        <label htmlFor="role">Role</label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? t.loading || "Loading..." : t.register || "Register"}
        </button>

        <div className="auth-links">
          <Link to="/login">{t.login || "Login"}</Link>
        </div>
      </form>
    </div>
  );
}
