import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "../../hooks/useTranslation";
import "../../components/styles/LoginPage.css";

export default function ForgotPasswordPage() {
  const { t, loading: langLoading } = useTranslation();
  const texts = t?.forgotPasswordPage;

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  if (langLoading || !texts) {
    return null; // або Loader
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email) {
      setError(texts.enterEmailError);
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email }
      );

      setMessage(texts.resetCodeSent);

      navigate("/auth/reset-password", {
        state: { email }
      });
    } catch (err) {
      setError(
        err.response?.data?.message || texts.somethingWentWrong
      );
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
        />

        <button type="submit" disabled={loading}>
          {loading ? texts.sendingButton : texts.sendCodeButton}
        </button>
      </form>
    </div>
  );
}
