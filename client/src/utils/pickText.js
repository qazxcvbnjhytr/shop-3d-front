export const normalizeLang = (lang) => (lang === "uk" ? "ua" : (lang || "ua"));

export const pickText = (val, lang = "ua") => {
  lang = normalizeLang(lang);

  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);

  // {ua, en}
  if (typeof val === "object") return String(val?.[lang] ?? val?.ua ?? val?.en ?? "");

  return "";
};
