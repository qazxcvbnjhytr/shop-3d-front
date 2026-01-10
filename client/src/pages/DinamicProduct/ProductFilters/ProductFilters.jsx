import React, { useEffect, useMemo, useState } from "react";
import "./ProductFilters.css";
import { useTranslation } from "../../../hooks/useTranslation";

function Section({ id, title, children, defaultOpen = true, focusSection }) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (focusSection && id === focusSection) setOpen(true);
  }, [focusSection, id]);

  return (
    <div className="pf-section" id={id}>
      <button
        type="button"
        className="pf-section-head"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <span className={`pf-caret ${open ? "is-open" : ""}`}>▾</span>
      </button>
      {open && <div className="pf-section-body">{children}</div>}
    </div>
  );
}

// helpers
const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
const sortKeys = (arr) => [...(arr || [])].sort((a, b) => String(a).localeCompare(String(b)));

export default function ProductFilters({
  value,
  onChange,
  onApply,
  onReset,
  onClose,
  loading,
  variant = "drawer",
  focusSection = "",
  facets = null, // ✅ NEW: { colorKeys, styleKeys, collectionKeys, materialKeys, manufacturerKeys, ... }
}) {
  const { t, loading: trLoading } = useTranslation();

  const tf = useMemo(() => t?.filters || {}, [t]);

  const tMaterials = useMemo(() => t?.materials || {}, [t]);
  const tManufacturers = useMemo(() => t?.manufacturers || {}, [t]);
  const tColors = useMemo(() => t?.colors || {}, [t]);
  const tStyles = useMemo(() => t?.styles || {}, [t]);
  const tCollections = useMemo(() => t?.collections || {}, [t]);

  const busy = loading || trLoading;
  const set = (patch) => onChange({ ...value, ...patch });

  const toggleInArray = (field, key) => {
    const prev = Array.isArray(value[field]) ? value[field] : [];
    const next = prev.includes(key)
      ? prev.filter((item) => item !== key)
      : [...prev, key];
    set({ [field]: next });
  };

  useEffect(() => {
    if (!focusSection) return;
    const el = document.getElementById(focusSection);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusSection]);


  const facetColorKeys = useMemo(() => {
    const fromFacets = Array.isArray(facets?.colorKeys) ? facets.colorKeys : null;
    const base = fromFacets ?? Object.keys(tColors);
    return sortKeys(uniq(base));
  }, [facets, tColors]);

  const facetStyleKeys = useMemo(() => {
    const fromFacets = Array.isArray(facets?.styleKeys) ? facets.styleKeys : null;
    const base = fromFacets ?? Object.keys(tStyles);
    return sortKeys(uniq(base));
  }, [facets, tStyles]);

  const facetCollectionKeys = useMemo(() => {
    const fromFacets = Array.isArray(facets?.collectionKeys) ? facets.collectionKeys : null;
    const base = fromFacets ?? Object.keys(tCollections);
    return sortKeys(uniq(base));
  }, [facets, tCollections]);

  const facetMaterialKeys = useMemo(() => {
    const fromFacets = Array.isArray(facets?.materialKeys) ? facets.materialKeys : null;
    const base = fromFacets ?? Object.keys(tMaterials);
    return sortKeys(uniq(base));
  }, [facets, tMaterials]);

  const facetManufacturerKeys = useMemo(() => {
    const fromFacets = Array.isArray(facets?.manufacturerKeys) ? facets.manufacturerKeys : null;
    const base = fromFacets ?? Object.keys(tManufacturers);
    return sortKeys(uniq(base));
  }, [facets, tManufacturers]);

  // ✅ chips (показуємо вибране)
  const chips = useMemo(() => {
    const list = [];

    if (value.q?.trim()) {
      list.push({ key: "q", label: `${tf.search}: ${value.q}`, clear: { q: "" } });
    }

    if (value.priceMin || value.priceMax) {
      list.push({
        key: "price",
        label: `${tf.price}: ${value.priceMin || 0}–${value.priceMax || "∞"}`,
        clear: { priceMin: "", priceMax: "" },
      });
    }

    if (value.materialKey) {
      list.push({
        key: "materialKey",
        label: `${tf.material}: ${tMaterials[value.materialKey] || value.materialKey}`,
        clear: { materialKey: "" },
      });
    }

    if (value.manufacturerKey) {
      list.push({
        key: "manufacturerKey",
        label: `${tf.manufacturer || "Виробник"}: ${tManufacturers[value.manufacturerKey] || value.manufacturerKey}`,
        clear: { manufacturerKey: "" },
      });
    }

    if (value.colorKeys?.length) {
      list.push({
        key: "colors",
        label: `${tf.colors}: ${value.colorKeys.length}`,
        clear: { colorKeys: [] },
      });
    }

    if (value.styleKeys?.length) {
      list.push({
        key: "styles",
        label: `${tf.styles}: ${value.styleKeys.length}`,
        clear: { styleKeys: [] },
      });
    }

    if (value.collectionKeys?.length) {
      list.push({
        key: "collections",
        label: `${tf.collections || "Колекції"}: ${value.collectionKeys.length}`,
        clear: { collectionKeys: [] },
      });
    }

    return list;
  }, [value, tf, tMaterials, tManufacturers]);

  return (
    <div className={`sidebar-filter-container ${variant === "drawer" ? "is-drawer" : ""}`}>
      <div className="pf-header">
        <h3 className="pf-title">{tf.title || "Фільтр"}</h3>
        <button className="pf-close" onClick={onClose}>×</button>
      </div>

      <div className="pf-selected">
        <button className="pf-chip pf-chip--reset" onClick={onReset}>
          {tf.reset || "Скинути"} <span className="pf-x">×</span>
        </button>

        {chips.map((c) => (
          <button key={c.key} className="pf-chip" onClick={() => set(c.clear)}>
            {c.label} <span className="pf-x">×</span>
          </button>
        ))}
      </div>

      <div className="pf-scroll">
        <Section id="pf-search" title={tf.search} focusSection={focusSection}>
          <input
            className="filter-search"
            value={value.q || ""}
            onChange={(e) => set({ q: e.target.value })}
            placeholder={tf.searchPlaceholder}
          />
        </Section>

        <Section id="pf-price" title={tf.price} focusSection={focusSection}>
          <div className="filter-range">
            <input
              type="number"
              placeholder="Від"
              value={value.priceMin || ""}
              onChange={(e) => set({ priceMin: e.target.value })}
            />
            <input
              type="number"
              placeholder="До"
              value={value.priceMax || ""}
              onChange={(e) => set({ priceMax: e.target.value })}
            />
          </div>
        </Section>

        {/* ✅ Materials (тільки актуальні) */}
        {facetMaterialKeys.length > 0 && (
          <Section id="pf-materials" title={tf.material || "Матеріал"} defaultOpen={false} focusSection={focusSection}>
            <div className="pf-list">
              {facetMaterialKeys.map((k) => (
                <label key={k} className="pf-item">
                  <input
                    type="radio"
                    name="materialKey"
                    checked={value.materialKey === k}
                    onChange={() => set({ materialKey: k })}
                  />
                  <span>{tMaterials[k] || k}</span>
                </label>
              ))}

              {/* Option to clear */}
              {value.materialKey && (
                <button
                  type="button"
                  className="pf-chip"
                  onClick={() => set({ materialKey: "" })}
                  style={{ marginTop: 8 }}
                >
                  {tf.clear || "Очистити"} <span className="pf-x">×</span>
                </button>
              )}
            </div>
          </Section>
        )}

        {/* ✅ Manufacturers (тільки актуальні) */}
        {facetManufacturerKeys.length > 0 && (
          <Section id="pf-manufacturers" title={tf.manufacturer || "Виробник"} defaultOpen={false} focusSection={focusSection}>
            <div className="pf-list">
              {facetManufacturerKeys.map((k) => (
                <label key={k} className="pf-item">
                  <input
                    type="radio"
                    name="manufacturerKey"
                    checked={value.manufacturerKey === k}
                    onChange={() => set({ manufacturerKey: k })}
                  />
                  <span>{tManufacturers[k] || k}</span>
                </label>
              ))}

              {value.manufacturerKey && (
                <button
                  type="button"
                  className="pf-chip"
                  onClick={() => set({ manufacturerKey: "" })}
                  style={{ marginTop: 8 }}
                >
                  {tf.clear || "Очистити"} <span className="pf-x">×</span>
                </button>
              )}
            </div>
          </Section>
        )}

        {/* ✅ Colors (тільки актуальні) */}
        {facetColorKeys.length > 0 && (
          <Section id="pf-colors" title={tf.colors} defaultOpen={false} focusSection={focusSection}>
            <div className="pf-list">
              {facetColorKeys.map((k) => (
                <label key={k} className="pf-item">
                  <input
                    type="checkbox"
                    checked={(value.colorKeys || []).includes(k)}
                    onChange={() => toggleInArray("colorKeys", k)}
                  />
                  <span>{tColors[k] || k}</span>
                </label>
              ))}
            </div>
          </Section>
        )}

        {/* ✅ Styles (тільки актуальні) */}
        {facetStyleKeys.length > 0 && (
          <Section id="pf-styles" title={tf.styles} defaultOpen={false} focusSection={focusSection}>
            <div className="pf-list">
              {facetStyleKeys.map((k) => (
                <label key={k} className="pf-item">
                  <input
                    type="checkbox"
                    checked={(value.styleKeys || []).includes(k)}
                    onChange={() => toggleInArray("styleKeys", k)}
                  />
                  <span>{tStyles[k] || k}</span>
                </label>
              ))}
            </div>
          </Section>
        )}

        {/* ✅ Collections (тільки актуальні) */}
        {facetCollectionKeys.length > 0 && (
          <Section id="pf-collections" title={tf.collections || "Колекції"} defaultOpen={false} focusSection={focusSection}>
            <div className="pf-list">
              {facetCollectionKeys.map((k) => (
                <label key={k} className="pf-item">
                  <input
                    type="checkbox"
                    checked={(value.collectionKeys || []).includes(k)}
                    onChange={() => toggleInArray("collectionKeys", k)}
                  />
                  <span>{tCollections[k] || k}</span>
                </label>
              ))}
            </div>
          </Section>
        )}

        <Section id="pf-options" title={tf.features} defaultOpen={false} focusSection={focusSection}>
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={!!value.hasDiscount}
              onChange={(e) => set({ hasDiscount: e.target.checked })}
            />
            <span>{tf.hasDiscount}</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={!!value.inStock}
              onChange={(e) => set({ inStock: e.target.checked })}
            />
            <span>{tf.inStockOnly}</span>
          </label>
        </Section>
      </div>

      <div className="pf-footer">
        <button className="apply-btn" onClick={onApply} disabled={busy}>
          {busy ? tf.loading : tf.apply}
        </button>
      </div>
    </div>
  );
}
