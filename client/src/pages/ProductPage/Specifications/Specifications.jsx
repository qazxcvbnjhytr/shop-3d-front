import React, { useMemo } from "react";
import "./Specifications.css";

const toNumberOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const getByPath = (obj, path) => {
  if (!obj || !path) return undefined;
  const parts = String(path).split(".").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
};

const pickLang = (val, lang) => {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val?.[lang] || val?.ua || val?.en || "";
};

const yesNo = (lang, v) =>
  v ? (lang === "en" ? "Yes" : "Так") : (lang === "en" ? "No" : "Ні");

export default function Specifications({
  product,
  language,
  t,
  specTemplate,
  specFields,
  dictionaries,
  loading,
}) {
  const txt = (key, fallback) => t?.productPage?.[key] || fallback;

  const fieldsByKey = useMemo(() => {
    const m = {};
    for (const f of specFields || []) m[f.key] = f;
    return m;
  }, [specFields]);

  const rows = useMemo(() => {
    if (!product || !specTemplate) return [];

    const dictRoot = dictionaries || {};

    const inStock =
      typeof product?.inStock === "boolean"
        ? product.inStock
        : Number(product?.stockQty) > 0;

    const stockQty = Number.isFinite(Number(product?.stockQty))
      ? Number(product.stockQty)
      : null;

    const out = [];

    const sections = Array.isArray(specTemplate?.sections)
      ? specTemplate.sections
      : [];

    for (const sec of sections) {
      const fieldKeys = Array.isArray(sec?.fieldKeys) ? sec.fieldKeys : [];

      for (const key of fieldKeys) {
        const field = fieldsByKey[key];
        if (!field || field.isActive === false) continue;

        const label = pickLang(field.label, language) || key;

        // 1) Dimensions (width/height/depth)
        if (field.kind === "dimensions") {
          const s = product?.specifications || {};
          const w = toNumberOrNull(s.width);
          const h = toNumberOrNull(s.height);
          const d = toNumberOrNull(s.depth);
          if (w == null && h == null && d == null) continue;

          out.push({
            k: label,
            v: `${w ?? "—"} × ${h ?? "—"} × ${d ?? "—"} см`,
          });
          continue;
        }

        // 2) Availability
        if (field.kind === "availability") {
          out.push({
            k: label,
            v: inStock
              ? txt("inStock", "В наявності")
              : txt("outOfStock", "Немає в наявності"),
          });
          continue;
        }

        // 3) stockQty
        if (field.key === "stockQty") {
          if (stockQty == null) continue;
          out.push({ k: label, v: String(stockQty) });
          continue;
        }

        // 4) bool (has3d uses modelUrl path)
        if (field.kind === "bool") {
          const raw = getByPath(product, field.path);
          out.push({ k: label, v: yesNo(language, !!raw) });
          continue;
        }

        // Raw value
        const raw = getByPath(product, field.path);

        // 5) number
        if (field.kind === "number") {
          const n = toNumberOrNull(raw);
          if (n == null) continue;

          const unit = field.unit;
          // Трохи красивіше для UI
          const unitTxt =
            unit === "months"
              ? language === "en"
                ? "mo."
                : "міс."
              : unit === "kg"
              ? "кг"
              : unit === "pcs"
              ? language === "en"
                ? "pcs"
                : "шт"
              : unit || "";

          out.push({ k: label, v: unitTxt ? `${n} ${unitTxt}` : String(n) });
          continue;
        }

        // 6) text
        if (field.kind === "text") {
          const s = String(raw || "").trim();
          if (!s) continue;
          out.push({ k: label, v: s });
          continue;
        }

        // 7) dict
        if (field.kind === "dict") {
          const k0 = String(raw || "").trim();
          if (!k0) continue;

          const dictName = field.dict;
          const dict = dictName ? dictRoot?.[dictName] : null;

          const v = dict?.[k0]?.[language] || dict?.[k0]?.ua || dict?.[k0]?.en || k0;

          out.push({ k: label, v });
          continue;
        }

        // 8) chips_dict
        if (field.kind === "chips_dict") {
          const arr = Array.isArray(raw) ? raw : [];
          if (!arr.length) continue;

          const dictName = field.dict;
          const dict = dictName ? dictRoot?.[dictName] : null;

          const labels = arr
            .map((kk) => dict?.[kk]?.[language] || dict?.[kk]?.ua || dict?.[kk]?.en || kk)
            .filter(Boolean);

          if (!labels.length) continue;
          out.push({ k: label, v: labels.join(", ") });
          continue;
        }

        // fallback
        if (raw != null && String(raw).trim()) out.push({ k: label, v: String(raw) });
      }
    }

    return out;
  }, [product, language, t, specTemplate, dictionaries, fieldsByKey]);

  if (loading) {
    return <div className="specs-empty">{txt("loading", "Завантаження...")}</div>;
  }

  return (
    <div className="specs">
      <div className="specs-head">
        <h2 className="specs-title">
          {txt("specsTitle", language === "en" ? "Specifications" : "Характеристики")}
        </h2>
        <p className="specs-subtitle">
          {txt(
            "specsSubtitle",
            language === "en" ? "Key parameters of the product." : "Ключові параметри товару."
          )}
        </p>
      </div>

      {rows.length ? (
        <div className="specs-card">
          <table className="specs-table">
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="specs-row">
                  <td className="specs-k">{r.k}</td>
                  <td className="specs-v">{r.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="specs-empty">
          {language === "en" ? "No specifications yet." : "Характеристик поки немає."}
        </div>
      )}
    </div>
  );
}
