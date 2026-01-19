import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../hooks/useTranslation";
import "../../components/styles/LoginPage.css";

import api from "../../../api/api.js";

export default function ForgotPasswordPage() {
  const { t, loading: langLoading } = useTranslation();
  const texts = t?.forgotPasswordPage;

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  if (langLoading || !texts) return null; // або Loader

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const safeEmail = String(email || "").trim();
    if (!safeEmail) {
      setError(texts.enterEmailError || "Вкажіть email");
      return;
    }

    setLoading(true);
    try {
      // ✅ api має baseURL = `${VITE_API_URL}${VITE_API_PREFIX||/api}`
      await api.post("/auth/forgot-password", { email: safeEmail });

      setMessage(texts.resetCodeSent || "Код надіслано");

      navigate("/auth/reset-password", {
        state: { email: safeEmail },
      });
    } catch (err) {
      setError(err?.response?.data?.message || texts.somethingWentWrong || "Щось пішло не так");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{texts.title}</h2>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-message">{message}</div>}

        <label>{texts.emailLabel}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={texts.emailPlaceholder}
          autoComplete="email"
        />

        <button type="submit" disabled={loading}>
          {loading ? texts.sendingButton : texts.sendCodeButton}
        </button>
      </form>
    </div>
  );
}
