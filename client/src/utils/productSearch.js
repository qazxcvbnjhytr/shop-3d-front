export const pickText = (value, language = "ua") => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") return value?.[language] || value?.ua || value?.en || "";
  return "";
};

const norm = (s) => String(s || "").toLowerCase().trim();

export const matchesProductQuery = (p, q, language = "ua") => {
  const term = norm(q);
  if (!term) return true;

  const specs = p?.specifications || {};

  const fields = [
    pickText(p?.name, language),
    pickText(p?.description, language),
    p?.typeKey,
    p?.category,
    specs?.materialKey,
    specs?.manufacturer,
    specs?.bedSize,
  ]
    .filter(Boolean)
    .map(norm);

  return fields.some((f) => f.includes(term));
};
