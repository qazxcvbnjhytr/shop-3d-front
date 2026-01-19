import React, { useEffect, useState } from "react";
import axios from "axios";
import { LanguageContext } from "./LanguageContext";

const API_URL = import.meta.env.VITE_API_URL;
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";

const normalizeOrigin = (url) => String(url || "").replace(/\/+$/, "");
const normalizePrefix = (p) => {
  const s = String(p || "/api").trim();
  if (!s) return "/api";
  return s.startsWith("/") ? s.replace(/\/+$/, "") : `/${s.replace(/\/+$/, "")}`;
};

if (!API_URL) {
  throw new Error("Missing VITE_API_URL in client/.env(.local)");
}

const BASE = `${normalizeOrigin(API_URL)}${normalizePrefix(API_PREFIX)}`;
// ✅ тепер translations endpoint: `${BASE}/translations/:lang`

export const LanguageProvider = ({ children }) => {
  const defaultLang = localStorage.getItem("language") || "ua";
  const [language, setLanguage] = useState(defaultLang);
  const [translations, setTranslations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchTranslations = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE}/translations/${language}`, {
          withCredentials: true, // якщо бек використовує cookies/cors credentials
        });
        if (isMounted) setTranslations(res.data);
      } catch (error) {
        console.error("Failed to load translations:", error);
        if (isMounted) setTranslations(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    localStorage.setItem("language", language);
    fetchTranslations();

    return () => {
      isMounted = false;
    };
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "ua" ? "en" : "ua"));
  };

  return (
    <LanguageContext.Provider
      value={{ language, translations, loading, toggleLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
