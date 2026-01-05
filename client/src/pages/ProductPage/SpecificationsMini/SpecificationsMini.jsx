import React, { useMemo } from "react";
import "./SpecificationsMini.css";

const normalizeLang = (l) => (l === "uk" ? "ua" : (l || "ua"));

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// colorsDict — це масив об'єктів з бази, який ми передамо в компонент
// [{ key: 'grey', hex: '#...', name: {ua: '...'} }, ...]
export default function SpecificationsMini({ product, language, t, colorsDict = [] }) {
  const lang = normalizeLang(language);

  // 1. Перетворюємо масив з бази на зручний об'єкт для пошуку:
  // Було: [ {key:'grey', ...} ] -> Стало: { 'grey': {hex, name} }
  const colorMap = useMemo(() => {
    return colorsDict.reduce((acc, item) => {
      acc[item.key] = item;
      return acc;
    }, {});
  }, [colorsDict]);

  if (!product) return null;

  const specs = product?.specifications || null;

  const labels = useMemo(() => {
    const pp = t?.productPage || {};
    return {
      size: pp.size || (lang === "en" ? "Size" : "Розмір"),
      material: pp.material || (lang === "en" ? "Material" : "Матеріал"),
      color: pp.color || (lang === "en" ? "Color" : "Колір"),
    };
  }, [t, lang]);

  const items = useMemo(() => {
    const out = [];

    // --- РОЗМІР (без змін) ---
    const width = toNum(specs?.width ?? product?.width);
    const depth = toNum(specs?.depth ?? product?.depth);
    const height = toNum(specs?.height ?? product?.height);
    if (width != null || depth != null || height != null) {
      out.push({
        label: labels.size,
        value: `${width ?? "—"} × ${depth ?? "—"} × ${height ?? "—"} ${lang === "en" ? "cm" : "см"}`,
      });
    }

    // --- МАТЕРІАЛ ---
    const materialKey = String(specs?.materialKey ?? product?.materialKey ?? "").trim();
    if (materialKey) {
      // Тут теж можна брати з бази, якщо t.materials не вистачає
      const matLabel = t?.materials?.[materialKey]?.[lang] ?? t?.materials?.[materialKey] ?? materialKey;
      out.push({
        label: labels.material,
        value: matLabel,
      });
    }

    // --- КОЛІР (Беремо дані з colorMap, який сформовано з бази) ---
    const colorKeys = Array.isArray(product?.colorKeys) ? product.colorKeys : [];
    
    if (colorKeys.length) {
      const colorValue = (
        <div className="spec-colors-wrapper">
          {colorKeys.map((k) => {
            // Шукаємо колір у нашому довіднику з бази
            const colorData = colorMap[k];
            
            // Якщо кольору немає в базі, показуємо просто ключ, або нічого
            if (!colorData) return null; 

            const label = colorData.name?.[lang] ?? colorData.name?.ua ?? k;
            const hex = colorData.hex || "#ccc"; // Сірий, якщо забули HEX

            return (
              <span key={k} className="spec-color-pill">
                <span 
                  className="spec-color-dot" 
                  style={{ backgroundColor: hex, border: hex === '#ffffff' ? '1px solid #ddd' : 'none' }} 
                />
                {label}
              </span>
            );
          })}
        </div>
      );

      if (colorKeys.length > 0) {
        out.push({
          label: labels.color,
          value: colorValue,
        });
      }
    }

    return out;
  }, [labels, lang, product, specs, t, colorMap]);

  if (!items.length) return null;

  return (
    <div className="spec-mini-container">
      {items.map((item, idx) => (
        <div key={`${item.label}-${idx}`} className="spec-mini-item">
          <span className="spec-mini-label">{item.label}:</span>
          <div className="spec-mini-value">{item.value}</div>
        </div>
      ))}
    </div>
  );
}