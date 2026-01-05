export const normalizeLang = (lang) => (lang === "uk" ? "ua" : (lang || "ua"));

export const pickText = (value, language) => {
  const lang = normalizeLang(language);

  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);

  if (typeof value === "object") {
    return String(value?.[lang] ?? value?.ua ?? value?.en ?? "");
  }

  return "";
};

export const toNumberOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const joinUrl = (base, raw) => {
  const b = String(base || "").replace(/\/+$/, "");
  const r = String(raw || "").trim();

  if (!r) return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(r)) return r;

  const path = r.startsWith("/") ? r : `/${r}`;
  return `${b}${path}`.replace(/\/{2,}/g, "/").replace(":/", "://");
};

/**
 * Важливо для твоєї помилки `null[1]`.
 * Використовуй замість `str.match(re)[1]` або `re.exec(str)[1]`.
 */
export const safeMatchGroup = (input, re, groupIndex = 1, fallback = "") => {
  const m = String(input ?? "").match(re);
  return m?.[groupIndex] ?? fallback;
};
