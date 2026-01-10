import React, { useMemo, useState, useRef, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import "./ProductFiltersBar.css";
import FilterDrawer from "../FilterDrawer";
import ProductFilters from "../ProductFilters";
import { useTranslation } from "../../../../hooks/useTranslation";

const mapByKeys = (keys = [], dict = {}) => {
  const out = {};
  (keys || []).forEach((k) => {
    const key = String(k || "").trim();
    if (!key) return;
    out[key] = dict?.[key] || key;
  });
  return out;
};

export default function ProductFiltersBar({
  value,
  onChange,
  onApply,
  onReset,
  className = "",
  facets = {}, // ✅ NEW
}) {
  const { t } = useTranslation();
  const tf = t?.filters || {};
  const [openDrawer, setOpenDrawer] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const barRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (barRef.current && !barRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dataFor = useMemo(() => {
    return {
      colors: mapByKeys(facets?.colorKeys, t?.colors),
      styles: mapByKeys(facets?.styleKeys, t?.styles),
      collections: mapByKeys(facets?.collectionKeys, t?.collections),
      materials: mapByKeys(facets?.materialKeys, t?.materials),
      manufacturers: mapByKeys(facets?.manufacturerKeys, t?.manufacturers),
    };
  }, [facets, t]);

  const items = useMemo(
    () => [
      { key: "colorKeys", label: tf.colors, type: "checkbox", data: dataFor.colors },
      { key: "stock", label: tf.stock, type: "stock" },
      { key: "materialKey", label: tf.material, type: "radio", data: dataFor.materials },
      { key: "styleKeys", label: tf.styles, type: "checkbox", data: dataFor.styles },
      { key: "collectionKeys", label: tf.collections || "Колекції", type: "checkbox", data: dataFor.collections },
      { key: "manufacturerKey", label: tf.manufacturer, type: "radio", data: dataFor.manufacturers },
    ],
    [tf, dataFor]
  );

  const toggleDropdown = (key) => setActiveDropdown(activeDropdown === key ? null : key);

  const handleToggleArray = (field, key) => {
    const prev = Array.isArray(value[field]) ? value[field] : [];
    const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
    onChange({ ...value, [field]: next });
  };

  const hasAnyOptions = (data) => data && Object.keys(data).length > 0;

  return (
    <div className={`pfbar-container ${className}`} ref={barRef}>
      <div className="pfbar-flex">
        {items.map((item) =>
          item.label ? (
            <div key={item.key} className="pfbar-item">
              <button
                type="button"
                className={`pfbar-btn ${activeDropdown === item.key ? "is-active" : ""}`}
                onClick={() => toggleDropdown(item.key)}
              >
                {item.label}
                <span className={`pfbar-arrow ${activeDropdown === item.key ? "up" : ""}`}>▾</span>
              </button>

              {activeDropdown === item.key && (
                <div className="pfbar-popover">
                  <div className="pfbar-popover-scroll">
                    {item.type !== "stock" && !hasAnyOptions(item.data) && (
                      <div className="pfbar-empty">{tf.emptyOptions || "Немає опцій"}</div>
                    )}

                    {item.data &&
                      Object.entries(item.data).map(([k, v]) => (
                        <label key={k} className="pfbar-option">
                          <input
                            type={item.type === "radio" ? "radio" : "checkbox"}
                            name={item.key}
                            checked={
                              item.type === "radio"
                                ? value[item.key] === k
                                : (value[item.key] || []).includes(k)
                            }
                            onChange={() =>
                              item.type === "radio"
                                ? onChange({ ...value, [item.key]: k })
                                : handleToggleArray(item.key, k)
                            }
                          />
                          <span className="pfbar-option-text">{v}</span>
                        </label>
                      ))}

                    {item.type === "stock" && (
                      <label className="pfbar-option">
                        <input
                          type="checkbox"
                          checked={!!value.inStock}
                          onChange={(e) => onChange({ ...value, inStock: e.target.checked })}
                        />
                        <span className="pfbar-option-text">{tf.inStockOnly || "В наявності"}</span>
                      </label>
                    )}
                  </div>

                  <div className="pfbar-popover-footer">
                    <button
                      className="pfbar-btn-apply"
                      onClick={() => {
                        onApply();
                        setActiveDropdown(null);
                      }}
                    >
                      {tf.apply || "Застосувати"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null
        )}

        <button type="button" className="pfbar-btn pfbar-btn-black" onClick={() => setOpenDrawer(true)}>
          {tf.allFilters || "Всі фільтри"}
          <SlidersHorizontal size={18} className="pfbar-icon-filters" />
        </button>
      </div>

      <FilterDrawer open={openDrawer} onClose={() => setOpenDrawer(false)}>
        <ProductFilters
          value={value}
          onChange={onChange}
          onApply={() => {
            onApply();
            setOpenDrawer(false);
          }}
          onReset={onReset}
          onClose={() => setOpenDrawer(false)}
          facets={facets} // ✅ NEW
        />
      </FilterDrawer>
    </div>
  );
}


