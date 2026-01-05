/* productHelpers.js */

export const DEFAULT_FILTERS = {
  q: "",
  sort: "newest",
  hasDiscount: false,
  hasModel: false,
  inStock: false,
  priceMin: "",
  priceMax: "",
  discountMin: "",
  discountMax: "",
  widthMin: "",
  widthMax: "",
  heightMin: "",
  heightMax: "",
  depthMin: "",
  depthMax: "",
  weightMin: "",
  weightMax: "",
  materialKey: "",
  manufacturerKey: "",
  bedSize: "",
  warrantyMin: "",
  warrantyMax: "",
  colorKeys: [],
  styleKeys: [],
  roomKeys: [],
  collectionKeys: [],
};

export const normalizeLang = (lang) => (lang === "uk" ? "ua" : lang || "ua");

export const pickText = (val, lang = "ua") => {
  lang = normalizeLang(lang);
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "object") return String(val?.[lang] ?? val?.ua ?? val?.en ?? "");
  return "";
};

export const parseBoolParam = (v) => {
  const s = String(v || "").toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
};

export const readArrayParam = (sp, key) => {
  const all = sp.getAll(key);
  const raw = all.length ? all : [sp.get(key)].filter(Boolean);
  return raw
    .flatMap((v) => String(v).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
};

export const readFiltersFromSearchParams = (sp) => ({
  q: sp.get("q") || "",
  sort: sp.get("sort") || "newest",
  hasDiscount: parseBoolParam(sp.get("hasDiscount")),
  hasModel: parseBoolParam(sp.get("hasModel")),
  inStock: parseBoolParam(sp.get("inStock")),
  priceMin: sp.get("priceMin") || "",
  priceMax: sp.get("priceMax") || "",
  discountMin: sp.get("discountMin") || "",
  discountMax: sp.get("discountMax") || "",
  widthMin: sp.get("widthMin") || "",
  widthMax: sp.get("widthMax") || "",
  heightMin: sp.get("heightMin") || "",
  heightMax: sp.get("heightMax") || "",
  depthMin: sp.get("depthMin") || "",
  depthMax: sp.get("depthMax") || "",
  weightMin: sp.get("weightMin") || "",
  weightMax: sp.get("weightMax") || "",
  materialKey: sp.get("materialKey") || "",
  manufacturerKey: sp.get("manufacturerKey") || "",
  bedSize: sp.get("bedSize") || "",
  warrantyMin: sp.get("warrantyMin") || "",
  warrantyMax: sp.get("warrantyMax") || "",
  colorKeys: readArrayParam(sp, "colorKeys"),
  styleKeys: readArrayParam(sp, "styleKeys"),
  roomKeys: readArrayParam(sp, "roomKeys"),
  collectionKeys: readArrayParam(sp, "collectionKeys"),
});

export const buildApiParams = (filters, base) => {
  const params = { ...(base || {}) };
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "boolean") {
      if (v) params[k] = "1";
      return;
    }
    if (Array.isArray(v)) {
      if (v.length) params[k] = v.join(",");
      return;
    }
    if (typeof v === "string" && v.trim() === "") return;
    params[k] = v;
  });
  return params;
};

export const filtersToSearchParamsObject = (filters) => {
  const obj = {};
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "boolean") {
      if (v) obj[k] = "1";
      return;
    }
    if (Array.isArray(v)) {
      if (v.length) obj[k] = v.join(",");
      return;
    }
    if (typeof v === "string" && v.trim() === "") return;
    obj[k] = String(v);
  });
  return obj;
};