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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  collectionKeys: [], // ✅
};

/* ✅ абсолютизація картинок */
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

  return raw
    .flatMap((v) => String(v).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
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
  collectionKeys: readArrayParam(sp, "collectionKeys"), // ✅
});

// ✅ для API: масиви -> CSV, boolean -> "1"
const buildApiParams = (filters, base) => {
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

// ✅ для URL: масиви -> CSV, boolean -> "1"
const filtersToSearchParamsObject = (filters) => {
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

export default function SubCategories() {
  const { category, sub } = useParams();
  const subKey = sub || "";

  const [searchParams, setSearchParams] = useSearchParams();

  const { language, t } = useTranslation();
  const lang = normalizeLang(language);

  const activeFilters = useMemo(() => readFiltersFromSearchParams(searchParams), [searchParams]);

  const [draftFilters, setDraftFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    ...activeFilters,
  }));

  const [parent, setParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ facets з БД (тільки існуючі ключі)
  const [facets, setFacets] = useState({
    colorKeys: [],
    styleKeys: [],
    roomKeys: [],
    collectionKeys: [],
    materialKeys: [],
    manufacturerKeys: [],
  });

  // sync draft with URL filters
  useEffect(() => {
    setDraftFilters((prev) => ({ ...prev, ...activeFilters }));
  }, [activeFilters]);

  // fetch parent/children + products + facets
  useEffect(() => {
    if (!category) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const base = subKey ? { category, subCategory: subKey } : { category };
        const params = buildApiParams(activeFilters, base);

        const [catRes, prodRes, facetsRes] = await Promise.all([
          axios.get(`${API_URL}/api/categories/${category}/children`, {
            params: { _ts: Date.now() },
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          }),
          axios.get(`${API_URL}/api/products/filter`, {
            params: { ...params, _ts: Date.now() },
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          }),
          axios.get(`${API_URL}/api/products/facets`, {
            params: { ...base, _ts: Date.now() },
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          }),
        ]);

        setParent(catRes.data?.parent || null);
        setChildren(Array.isArray(catRes.data?.children) ? catRes.data.children : []);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);

        setFacets(
          facetsRes.data || {
            colorKeys: [],
            styleKeys: [],
            roomKeys: [],
            collectionKeys: [],
            materialKeys: [],
            manufacturerKeys: [],
          }
        );
      } catch (err) {
        console.error("[SubCategories] load error:", err);
        setParent(null);
        setChildren([]);
        setProducts([]);
        setFacets({
          colorKeys: [],
          styleKeys: [],
          roomKeys: [],
          collectionKeys: [],
          materialKeys: [],
          manufacturerKeys: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, subKey, activeFilters]);

  const onApplyFilters = () => {
    setSearchParams(filtersToSearchParamsObject(draftFilters), { replace: false });
  };

  const onResetFilters = () => {
    setDraftFilters({ ...DEFAULT_FILTERS });
    setSearchParams({}, { replace: false });
  };

  const removeTag = (field, valueToRemove) => {
    const current = draftFilters[field];
    let next;

    if (Array.isArray(current)) next = current.filter((v) => v !== valueToRemove);
    else next = DEFAULT_FILTERS[field];

    const updated = { ...draftFilters, [field]: next };
    setDraftFilters(updated);
    setSearchParams(filtersToSearchParamsObject(updated), { replace: false });
  };

  const activeChips = useMemo(() => {
    const list = [];

    if (activeFilters.colorKeys?.length) {
      activeFilters.colorKeys.forEach((k) =>
        list.push({ field: "colorKeys", val: k, label: t?.colors?.[k] || k })
      );
    }

    if (activeFilters.styleKeys?.length) {
      activeFilters.styleKeys.forEach((k) =>
        list.push({ field: "styleKeys", val: k, label: t?.styles?.[k] || k })
      );
    }

    if (activeFilters.collectionKeys?.length) {
      activeFilters.collectionKeys.forEach((k) =>
        list.push({ field: "collectionKeys", val: k, label: t?.collections?.[k] || k })
      );
    }

    if (activeFilters.materialKey) {
      list.push({
        field: "materialKey",
        val: activeFilters.materialKey,
        label: t?.materials?.[activeFilters.materialKey] || activeFilters.materialKey,
      });
    }

    if (activeFilters.manufacturerKey) {
      list.push({
        field: "manufacturerKey",
        val: activeFilters.manufacturerKey,
        label: t?.manufacturers?.[activeFilters.manufacturerKey] || activeFilters.manufacturerKey,
      });
    }

    return list;
  }, [activeFilters, t]);

  const parentTitle = useMemo(() => {
    return pickText(parent?.names, lang) || category || "";
  }, [parent, lang, category]);

  const activeChild = useMemo(() => {
    if (!subKey) return null;
    return children.find((c) => c?.key === subKey) || null;
  }, [children, subKey]);

  const title = useMemo(() => {
    if (activeChild) return pickText(activeChild?.names, lang) || subKey;
    return parentTitle || category;
  }, [activeChild, parentTitle, lang, subKey, category]);

  const qs = searchParams.toString();

  return (
    <div className="sc-page">
      <div className="sc-topbar">
        <Link className="sc-back" to="/catalog">
          ← {t?.catalogPage?.catalog || "Каталог"}
        </Link>
      </div>

      <h1 className="sc-title">{title}</h1>

      <div className="sc-strip">
        {children.map((c) => {
          const avatarSrc = absImg(c.image);
          const name = pickText(c.names, lang) || c.key;

          const to = qs
            ? `/catalog/${encodeURIComponent(category)}/${encodeURIComponent(c.key)}?${qs}`
            : `/catalog/${encodeURIComponent(category)}/${encodeURIComponent(c.key)}`;

          const isActive = subKey === c.key;

          return (
            <Link key={c.key} to={to} className={`sc-item ${isActive ? "sc-item--active" : ""}`}>
              <div className="sc-avatar">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={c.key}
                    onError={(e) => {
                      e.currentTarget.src = "/logo-sample.jpeg";
                    }}
                  />
                ) : (
                  <div className="sc-avatar__fallback">
                    {String(name).slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="sc-name">{name}</div>
            </Link>
          );
        })}
      </div>

      <ProductFiltersBar
        value={draftFilters}
        onChange={setDraftFilters}
        onApply={onApplyFilters}
        onReset={onResetFilters}
        facets={facets} // ✅ NEW
      />

      <ActiveChipsRow
        chips={activeChips}
        onReset={onResetFilters}
        onRemove={removeTag}
        resetText="Скинути всі"
      />

      <section className="sc-products-grid">
        {loading ? (
          <div className="sc-state">Завантаження...</div>
        ) : products.length ? (
          <div className="catalog-grid">
            {products.map((item) => {
              const itemSub = item?.subCategory || item?.subCategoryKey || subKey || "all";
              return (
                <ProductCard
                  key={item._id}
                  item={item}
                  apiUrl={API_URL}
                  category={category}
                  subKey={itemSub}
                  lang={lang}
                  rating={0}
                  count={0}
                />
              );
            })}
          </div>
        ) : (
          <div className="sc-state">
            {lang === "ua" ? "Товарів не знайдено." : "No products found."}
          </div>
        )}
      </section>
    </div>
  );
}
