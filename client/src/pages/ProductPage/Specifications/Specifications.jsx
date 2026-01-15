import React, { useMemo } from "react";
import "./Specifications.css";

const toNumberOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const normalizeLang = (lang) => (lang === "uk" ? "ua" : (lang || "ua"));

export default function Specifications({ product, language, translations }) {
  const lang = normalizeLang(language);

  const texts = translations?.productPage || {};
  const tr = (key, fallback) => {
    const v = texts?.[key];
    return typeof v === "string" && v.trim() ? v : fallback;
  };

  // словники (якщо їх нема — просто покажемо ключ)
  const dictCollections = translations?.collections || {};
  const dictColors = translations?.colors || {};
  const dictStyles = translations?.styles || {};
  const dictRooms = translations?.rooms || {};
  const dictMaterials = translations?.materials || {};
  const dictManufacturers = translations?.manufacturers || {};

  const mapKeys = (keys, dict) =>
    (Array.isArray(keys) ? keys : [])
      .map((k) => dict?.[k] || k)
      .filter(Boolean);

  const rows = useMemo(() => {
    if (!product) return [];

    const s = product?.specifications || {};

    const width = toNumberOrNull(s.width);
    const height = toNumberOrNull(s.height);
    const depth = toNumberOrNull(s.depth);
    const weight = toNumberOrNull(s.weight);
    const warranty = toNumberOrNull(s.warranty);

    const stockQty = Number.isFinite(Number(product?.stockQty))
      ? Number(product.stockQty)
      : null;

    // ✅ "користувацька" логіка наявності:
    // якщо є stockQty — орієнтуємось по ньому, інакше — по product.inStock
    const inStockComputed =
      stockQty !== null ? stockQty > 0 : !!product?.inStock;

    const collectionLabels = mapKeys(product?.collectionKeys, dictCollections);
    const colorLabels = mapKeys(product?.colorKeys, dictColors);
    const styleLabels = mapKeys(product?.styleKeys, dictStyles);
    const roomLabels = mapKeys(product?.roomKeys, dictRooms);

    const materialKey = s.materialKey || product?.materialKey || "";
    const manufacturerKey = s.manufacturerKey || product?.manufacturerKey || "";

    const materialLabel = materialKey ? dictMaterials[materialKey] || materialKey : "";
    const manufacturerLabel = manufacturerKey
      ? dictManufacturers[manufacturerKey] || manufacturerKey
      : "";

    const has3d =
      (Array.isArray(product?.featureKeys) && product.featureKeys.includes("has_3d")) ||
      !!product?.modelUrl;

    const list = [];

    // Колекція
    if (collectionLabels.length) {
      list.push({ k: tr("collection", "Колекція"), v: collectionLabels.join(", ") });
    }

    // Розміри
    if (width !== null || height !== null || depth !== null) {
      list.push({
        k: tr("dimensions", "Розміри (Ш×В×Г)"),
        v: `${width ?? "—"} × ${height ?? "—"} × ${depth ?? "—"} см`,
      });
    }

    // Матеріал / виробник
    if (materialLabel) list.push({ k: tr("material", "Матеріал"), v: materialLabel });
    if (manufacturerLabel) list.push({ k: tr("manufacturer", "Виробник"), v: manufacturerLabel });

    // Колір / стиль / кімната
    if (colorLabels.length) list.push({ k: tr("colors", "Колір"), v: colorLabels.join(", ") });
    if (styleLabels.length) list.push({ k: tr("styles", "Стиль"), v: styleLabels.join(", ") });
    if (roomLabels.length) list.push({ k: tr("rooms", "Кімната"), v: roomLabels.join(", ") });

    // Гарантія / вага
    if (warranty !== null) list.push({ k: tr("warranty", "Гарантія"), v: `${warranty} міс.` });
    if (weight !== null) list.push({ k: tr("weight", "Вага"), v: `${weight} кг` });

    // 3D
    list.push({ k: tr("has3d", "3D модель"), v: has3d ? tr("yes", "Так") : tr("no", "Ні") });

    // Наявність (+ кількість, якщо є)
    list.push({
      k: tr("availability", "Наявність"),
      v: inStockComputed ? tr("inStock", "В наявності") : tr("outOfStock", "Немає в наявності"),
    });

    if (stockQty !== null) {
      list.push({ k: tr("stockQty", "К-сть"), v: String(stockQty) });
    }

    return list;
  }, [product, translations, lang]);

  return (
    <div className="specs">
      <div className="specs-head">
        <h2 className="specs-title">
          {tr("specsTitle", lang === "en" ? "Specifications" : "Характеристики")}
        </h2>
        <p className="specs-subtitle">
          {tr("specsSubtitle", lang === "en" ? "Key parameters of the product." : "Ключові параметри товару.")}
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
          {lang === "en" ? "No specifications yet." : "Характеристик поки немає."}
        </div>
      )}
    </div>
  );
}
