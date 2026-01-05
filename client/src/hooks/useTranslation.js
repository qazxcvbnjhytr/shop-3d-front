import { useContext, useMemo } from "react";
import { LanguageContext } from "@context/LanguageContext";

/**
 * Named export: useTranslation
 * Повертає { language, t, translations }
 * t — це об'єкт перекладів, щоб ти могла писати t.productPage..., t.colors..., і т.д.
 */
export function useTranslation() {
  const ctx = useContext(LanguageContext);

  const language = ctx?.language || "ua";

  // Підхоплюємо різні можливі назви стану з перекладами
  const translations = ctx?.translations || ctx?.t || ctx?.data || {};

  const t = useMemo(() => translations || {}, [translations]);

  return { language, t, translations };
}
