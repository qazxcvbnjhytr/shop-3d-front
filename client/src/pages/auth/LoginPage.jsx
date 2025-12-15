import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LanguageContext } from "../../context/LanguageContext";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx"; // Використовуємо контекст Auth
import "../../components/styles/LoginPage.css";

export default function LoginPage() {
  const { language, translations } = useContext(LanguageContext);
  const t = translations?.[language]?.auth || {};
  const navigate = useNavigate();
  const { login } = useAuth(); // отримуємо login з AuthContext

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError(t.fillAllFields || "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password); // через AuthContext
      // Перевірка ролі
      if (data.user.role === "admin") {
        navigate("/admin/dashboard"); // редірект для адміна
      } else {
        navigate("/account"); // редірект для звичайного користувача
      }
    } catch (err) {
      setError(err.response?.data?.message || t.loginFailed || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleLogin}>
        <h2>{t.login || "Login"}</h2>
        {error && <div className="auth-error">{error}</div>}

        <label htmlFor="email">{t.email || "Email"}</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder || "Enter your email"}
        />

        <label htmlFor="password">{t.password || "Password"}</label>
        <div className="password-wrapper" style={{ position: "relative" }}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.passwordPlaceholder || "Enter your password"}
            style={{ paddingRight: "35px" }}
          />
          <span
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: "#555",
            }}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </span>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? t.loading || "Loading..." : t.login || "Login"}
        </button>

        <div className="auth-links">
          <Link to="/auth/register">{t.register || "Register"}</Link>
          <Link to="/auth/forgot-password">
            {t.forgotPassword || "Forgot Password?"}
          </Link>
        </div>
      </form>
    </div>
  );
}
