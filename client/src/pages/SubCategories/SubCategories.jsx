import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";

import ProductFiltersBar from "../DinamicProduct/ProductFilters/ProductFiltersBar/ProductFiltersBar";
import ProductCard from "../DinamicProduct/ProductCard/ProductCard";
import ActiveChipsRow from "../DinamicProduct/ActiveChipsRow/ActiveChipsRow";

import { useTranslation } from "../../hooks/useTranslation";
import { normalizeLang, pickText } from "../../utils/pickText";

import "./SubCategories.css";
import "../DinamicProduct/DinamicProduct.css";

const API_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "");

const DEFAULT_FILTERS = {
  q: "",
  sort: "newest",
  hasDiscount: false,
  hasModel: false,
  priceMin: "",
  priceMax: "",
  materialKey: "",
  manufacturerKey: "",
  colorKeys: [],
  styleKeys: [],
  collectionKeys: [],
};

const absImg = (src) => {
  if (!src || typeof src !== "string" || src.trim() === "") return null;
  if (src.startsWith("http")) return src;
  if (src.startsWith("/img") || src.startsWith("/static")) return src;
  return `${API_URL}${src.startsWith("/") ? src : "/" + src}`;
};

const parseBoolParam = (v) => {
  const s = String(v || "").toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
};

const readArrayParam = (sp, key) => {
  const all = sp.getAll(key);
  const raw = all.length ? all : [sp.get(key)].filter(Boolean);
  return raw.flatMap((v) => String(v).split(",")).map((s) => s.trim()).filter(Boolean);
};

const readFiltersFromSearchParams = (sp) => ({
  q: sp.get("q") || "",
  sort: sp.get("sort") || "newest",
  hasDiscount: parseBoolParam(sp.get("hasDiscount")),
  hasModel: parseBoolParam(sp.get("hasModel")),
  priceMin: sp.get("priceMin") || "",
  priceMax: sp.get("priceMax") || "",
  materialKey: sp.get("materialKey") || "",
  manufacturerKey: sp.get("manufacturerKey") || "",
  colorKeys: readArrayParam(sp, "colorKeys"),
  styleKeys: readArrayParam(sp, "styleKeys"),
  collectionKeys: readArrayParam(sp, "collectionKeys"),
});

const buildApiParams = (filters, base) => {
  const params = { ...(base || {}) };
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "boolean") { if (v) params[k] = "1"; return; }
    if (Array.isArray(v)) { if (v.length) params[k] = v.join(","); return; }
    if (typeof v === "string" && v.trim() === "") return;
    params[k] = v;
  });
  return params;
};

const filtersToSearchParamsObject = (filters) => {
  const obj = {};
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "boolean") { if (v) obj[k] = "1"; return; }
    if (Array.isArray(v)) { if (v.length) obj[k] = v.join(","); return; }
    if (typeof v === "string" && v.trim() === "") return;
    obj[k] = String(v);
  });
  return obj;
};

export default function SubCategories() {
  const { category, sub } = useParams();
  const subKey = sub || "";
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, t } = useTranslation();
  const lang = normalizeLang(language);

  const activeFilters = useMemo(() => readFiltersFromSearchParams(searchParams), [searchParams]);
  const [draftFilters, setDraftFilters] = useState(() => ({ ...DEFAULT_FILTERS, ...activeFilters }));

  const [parent, setParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState({ colorKeys: [], styleKeys: [], roomKeys: [], collectionKeys: [], materialKeys: [], manufacturerKeys: [] });

  useEffect(() => { setDraftFilters((prev) => ({ ...prev, ...activeFilters })); }, [activeFilters]);

  useEffect(() => {
    if (!category) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const base = subKey ? { category, subCategory: subKey } : { category };
        const params = buildApiParams(activeFilters, base);

        const [catRes, prodRes, facetsRes] = await Promise.all([
          axios.get(`${API_URL}/api/categories/${category}/children`, { params: { _ts: Date.now() } }),
          axios.get(`${API_URL}/api/products/filter`, { params: { ...params, _ts: Date.now() } }),
          axios.get(`${API_URL}/api/products/facets`, { params: { ...base, _ts: Date.now() } }),
        ]);

        setParent(catRes.data?.parent || null);
        setChildren(Array.isArray(catRes.data?.children) ? catRes.data.children : []);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
        setFacets(facetsRes.data || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [category, subKey, activeFilters]);

  const onApplyFilters = () => setSearchParams(filtersToSearchParamsObject(draftFilters), { replace: false });
  const onResetFilters = () => { setDraftFilters({ ...DEFAULT_FILTERS }); setSearchParams({}, { replace: false }); };

  const removeTag = (field, valueToRemove) => {
    const current = draftFilters[field];
    const next = Array.isArray(current) ? current.filter((v) => v !== valueToRemove) : DEFAULT_FILTERS[field];
    const updated = { ...draftFilters, [field]: next };
    setDraftFilters(updated);
    setSearchParams(filtersToSearchParamsObject(updated), { replace: false });
  };

  const activeChips = useMemo(() => {
    const list = [];
    const fields = ["colorKeys", "styleKeys", "collectionKeys", "materialKey", "manufacturerKey"];
    fields.forEach(f => {
      const val = activeFilters[f];
      if (Array.isArray(val)) val.forEach(v => list.push({ field: f, val: v, label: t?.[f.replace('Keys', 's')]?.[v] || v }));
      else if (val) list.push({ field: f, val, label: t?.[f.replace('Key', 's')]?.[val] || val });
    });
    return list;
  }, [activeFilters, t]);

  const title = useMemo(() => {
    const activeChild = children.find(c => c?.key === subKey);
    return activeChild ? pickText(activeChild?.names, lang) : (pickText(parent?.names, lang) || category);
  }, [children, subKey, parent, lang, category]);

  const qs = searchParams.toString();

  return (
    <div className="sc-page">
      <div className="sc-topbar">
        <Link className="sc-back" to="/catalog">← {t?.catalogPage?.catalog || "Каталог"}</Link>
      </div>

      <h1 className="sc-title">{title}</h1>

      <div className="sc-strip">
        {children.map((c) => {
          const avatarSrc = absImg(c.image);
          const name = pickText(c.names, lang) || c.key;
          const to = `/catalog/${encodeURIComponent(category)}/${encodeURIComponent(c.key)}${qs ? `?${qs}` : ""}`;
          return (
            <Link key={c.key} to={to} className={`sc-item ${subKey === c.key ? "sc-item--active" : ""}`}>
              <div className="sc-avatar">
                {avatarSrc ? <img src={avatarSrc} alt={name} /> : <div className="sc-avatar__fallback">{String(name).slice(0, 1).toUpperCase()}</div>}
              </div>
              <div className="sc-name">{name}</div>
            </Link>
          );
        })}
      </div>

      <ProductFiltersBar value={draftFilters} onChange={setDraftFilters} onApply={onApplyFilters} onReset={onResetFilters} facets={facets} />
      
      <div className="sc-results-meta">
        <ActiveChipsRow chips={activeChips} onReset={onResetFilters} onRemove={removeTag} resetText="Скинути всі" />
        <span className="sc-results-count">{products.length} {lang === "ua" ? "товарів знайдено" : "products found"}</span>
      </div>

      <section className="sc-main-content">
        {loading ? (
          <div className="catalog-grid">
            {[...Array(8)].map((_, i) => <div key={i} className="sc-skeleton-card" />)}
          </div>
        ) : products.length ? (
          <div className="catalog-grid">
            {products.map((item) => (
              <ProductCard 
                key={item._id} 
                item={item} 
                apiUrl={API_URL} 
                category={category} 
                subKey={item?.subCategory || subKey || "all"} 
                lang={lang} 
              />
            ))}
          </div>
        ) : (
          <div className="sc-empty-container">
            <p className="sc-empty-text">{lang === "ua" ? "Нічого не знайдено за вибраними фільтрами." : "No products found for selected filters."}</p>
            <button onClick={onResetFilters} className="sc-reset-btn">Скинути все</button>
          </div>
        )}
      </section>
    </div>
  );
}