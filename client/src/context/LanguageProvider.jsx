import React, { useEffect, useState } from "react";
import axios from "axios";
import { LanguageContext } from "./LanguageContext";

const API_URL = "http://localhost:5000/api/translations";

export const LanguageProvider = ({ children }) => {
  // Поточна мова (з localStorage або ua)
const defaultLang = localStorage.getItem("language") || "ua";
  const [language, setLanguage] = useState(defaultLang);
  const [translations, setTranslations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchTranslations = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/${language}`);
        if (isMounted) {
          setTranslations(res.data);
        }
      } catch (error) {
        console.error("Failed to load translations:", error);
        if (isMounted) {
          setTranslations(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    localStorage.setItem("language", language);
    fetchTranslations();

    return () => {
      isMounted = false;
    };
  }, [language]);

  // Перемикач мови
const toggleLanguage = () => {
  setLanguage(prev => (prev === "ua" ? "en" : "ua"));
};
  return (
    <LanguageContext.Provider
      value={{
        language,
        translations,
        loading,
        toggleLanguage
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
