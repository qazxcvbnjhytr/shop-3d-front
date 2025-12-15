// client/src/hooks/useTranslation.js

import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

export const useTranslation = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }

  const { translations, language, toggleLanguage, loading } = context;

  return {
    t: translations,
    language,
    toggleLanguage,
    loading
  };
};
