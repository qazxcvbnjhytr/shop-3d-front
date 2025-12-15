import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx"; // використовуємо контекст Auth
import { LanguageContext } from "../../context/LanguageContext";
import { Eye, EyeOff } from "lucide-react";
import "../../components/styles/LoginPage.css";

export default function RegisterPage() {
  const { language, translations } = useContext(LanguageContext);
  const t = translations?.[language]?.auth || {};
  const navigate = useNavigate();
  const { login } = useAuth(); // використання контексту

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // за замовчуванням роль користувача
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError(t.fillAllFields || "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      // реєстрація через API
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");

      // після реєстрації автоматично логін
      await login(email, password);

      // редірект залежно від ролі
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/account");
      }
    } catch (err) {
      setError(err.message || t.registerFailed || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

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
        />

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

        {/* Поле вибору ролі для тестування адміністраторів */}
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
