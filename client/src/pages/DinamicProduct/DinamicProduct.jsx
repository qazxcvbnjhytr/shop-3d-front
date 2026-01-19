// client/src/pages/DinamicProduct/DinamicProduct.jsx
import React, { useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import axios from "axios";

import ProductFiltersBar from "./ProductFilters/ProductFiltersBar/ProductFiltersBar";
import ProductsGrid from "./ProductsGrid/ProductsGrid";
import ActiveChipsRow from "./ActiveChipsRow/ActiveChipsRow";

import { LanguageContext } from "../../context/LanguageContext";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";
import { useCategories } from "../../hooks/useCategories";
import { useTranslation } from "../../hooks/useTranslation";

import {
  DEFAULT_FILTERS,
  normalizeLang,
  pickText,
  readFiltersFromSearchParams,
  buildApiParams,
  filtersToSearchParamsObject,
} from "./productHelpers";

import "./DinamicProduct.css";

// ✅ env-first (без localhost fallback)
const RAW_API = import.meta.env.VITE_API_URL;
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";

const normalizeOrigin = (url) => String(url || "").replace(/\/+$/, "");
const normalizePrefix = (p) => {
  const s = String(p || "/api").trim();
  if (!s) return "/api";
  return s.startsWith("/") ? s.replace(/\/+$/, "") : `/${s.replace(/\/+$/, "")}`;
};

if (!RAW_API) {
  throw new Error("Missing VITE_API_URL in client/.env(.local)");
}

const API_ORIGIN = normalizeOrigin(RAW_API);
const API_BASE = `${API_ORIGIN}${normalizePrefix(API_PREFIX)}`; // e.g. https://xxx.up.railway.app/api

const ITEMS_PER_PAGE = 9;

export default function DinamicProduct() {
  const { category, sub } = useParams();
  const subKey = sub || "all";

  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilters = useMemo(() => readFiltersFromSearchParams(searchParams), [searchParams]);
  const q = activeFilters.q || "";

  const { language, loading: langLoading } = useContext(LanguageContext);
  const lang = normalizeLang(language);

  const { categoriesMap, loading: categoriesLoading } = useCategories();
  const { setData } = useBreadcrumbs();
  const { t, loading: trLoading } = useTranslation();

  const [draftFilters, setDraftFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    ...activeFilters,
  }));

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [categoryChildren, setCategoryChildren] = useState([]);
  const [categoryParent, setCategoryParent] = useState(null);

  // ✅ axios instance з baseURL один раз
  const api = useMemo(() => {
    return axios.create({
      baseURL: API_BASE,
      withCredentials: true,
      timeout: 20000,
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
  }, []);

  // Синхронізація локальних фільтрів з URL
  useEffect(() => {
    setDraftFilters((prev) => ({ ...prev, ...activeFilters }));
  }, [activeFilters]);

  // ✅ Завантаження інфи по категорії: parent + children (abort-safe)
  useEffect(() => {
    if (!category) return;

    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await api.get(`/categories/${encodeURIComponent(category)}/children`, {
          params: { lang, _ts: Date.now() },
          signal: controller.signal,
        });

        if (!alive) return;
        setCategoryParent(res.data?.parent || null);
        setCategoryChildren(Array.isArray(res.data?.children) ? res.data.children : []);
      } catch (e) {
        if (!alive) return;
        // axios cancel or abort -> just ignore
        if (axios.isCancel?.(e)) return;
        setCategoryParent(null);
        setCategoryChildren([]);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [category, api, lang]);

  const parentName = useMemo(() => {
    const fromApi = pickText(categoryParent?.names, lang);
    if (fromApi) return fromApi;

    const item = categoriesMap?.[category];
    return pickText(item, lang) || pickText(item?.names, lang) || category || "";
  }, [category, categoriesMap, categoryParent, lang]);

  const subName = useMemo(() => {
    if (!subKey || subKey === "all") return lang === "ua" ? "Усі товари" : "All products";

    const fromChildren = categoryChildren.find((c) => String(c?.key) === String(subKey));
    const childName = pickText(fromChildren?.names, lang);
    if (childName) return childName;

    const item = categoriesMap?.[subKey];
    const fromMap = pickText(item, lang) || pickText(item?.names, lang);
    if (fromMap) return fromMap;

    return subKey;
  }, [subKey, categoryChildren, categoriesMap, lang]);

  // ✅ Оновлення breadcrumbs
  useEffect(() => {
    setData?.((prev) => ({
      ...(prev || {}),
      categoryCode: category,
      subCategoryKey: subKey, // ✅ у тебе в Breadcrumbs використовується subCategoryKey
      productName: null,
    }));
  }, [category, subKey, setData]);

  // ✅ Основний запит товарів (abort-safe + reset page)
  useEffect(() => {
    if (!category) return;

    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        setLoadingProducts(true);

        const base = subKey && subKey !== "all" ? { category, subCategory: subKey } : { category };
        const params = buildApiParams(activeFilters, base);

        const res = await api.get("/products/filter", {
          params: { ...params, lang, _ts: Date.now() },
          signal: controller.signal,
        });

        if (!alive) return;
        setProducts(Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.items) ? res.data.items : []));
      } catch (err) {
        if (!alive) return;
        if (axios.isCancel?.(err)) return;

        console.error("[DinamicProduct] products load error:", err?.response?.data || err?.message || err);
        setProducts([]);
      } finally {
        if (alive) setLoadingProducts(false);
      }
    })();

    setCurrentPage(1);

    return () => {
      alive = false;
      controller.abort();
    };
  }, [category, subKey, activeFilters, api, lang]);

  const onApplyFilters = useCallback(() => {
    const obj = filtersToSearchParamsObject(draftFilters);
    setSearchParams(obj, { replace: false });
    setCurrentPage(1);
  }, [draftFilters, setSearchParams]);

  const onResetFilters = useCallback(() => {
    setDraftFilters({ ...DEFAULT_FILTERS });
    setSearchParams({}, { replace: false });
    setCurrentPage(1);
  }, [setSearchParams]);

  const removeTag = useCallback(
    (field, valueToRemove) => {
      const current = draftFilters[field];
      let next;

      if (Array.isArray(current)) {
        next = current.filter((v) => v !== valueToRemove);
      } else {
        next = DEFAULT_FILTERS[field];
      }

      const updated = { ...draftFilters, [field]: next };
      setDraftFilters(updated);
      setSearchParams(filtersToSearchParamsObject(updated), { replace: false });
      setCurrentPage(1);
    },
    [draftFilters, setSearchParams]
  );

  const activeChips = useMemo(() => {
    const list = [];
    const f = activeFilters;

    if (f.hasDiscount) list.push({ field: "hasDiscount", val: "1", label: lang === "ua" ? "Зі знижкою" : "With discount" });
    if (f.hasModel) list.push({ field: "hasModel", val: "1", label: lang === "ua" ? "Є 3D" : "Has 3D" });
    if (f.inStock) list.push({ field: "inStock", val: "1", label: lang === "ua" ? "В наявності" : "In stock" });
    if (String(f.q || "").trim()) list.push({ field: "q", val: f.q, label: `q: ${f.q}` });

    const mkRange = (minKey, maxKey, title, suffix = "") => {
      const a = String(f[minKey] || "").trim();
      const b = String(f[maxKey] || "").trim();
      if (!a && !b) return;
      const text = a && b ? `${a}–${b}${suffix}` : a ? `від ${a}${suffix}` : `до ${b}${suffix}`;
      list.push({ field: minKey, val: `${a}|${b}`, label: `${title}: ${text}` });
    };

    mkRange("priceMin", "priceMax", lang === "ua" ? "Ціна" : "Price", " грн");
    mkRange("discountMin", "discountMax", lang === "ua" ? "Знижка" : "Discount", "%");
    mkRange("widthMin", "widthMax", lang === "ua" ? "Ширина" : "Width", " см");
    mkRange("heightMin", "heightMax", lang === "ua" ? "Висота" : "Height", " см");
    mkRange("depthMin", "depthMax", lang === "ua" ? "Глибина" : "Depth", " см");
    mkRange("weightMin", "weightMax", lang === "ua" ? "Вага" : "Weight", " кг");
    mkRange("warrantyMin", "warrantyMax", lang === "ua" ? "Гарантія" : "Warranty", " міс");

    if (f.materialKey) list.push({ field: "materialKey", val: f.materialKey, label: t?.materials?.[f.materialKey] || f.materialKey });
    if (f.manufacturerKey) list.push({ field: "manufacturerKey", val: f.manufacturerKey, label: t?.manufacturers?.[f.manufacturerKey] || f.manufacturerKey });
    if (f.bedSize) list.push({ field: "bedSize", val: f.bedSize, label: (lang === "ua" ? "Розмір" : "Size") + `: ${f.bedSize}` });

    const addArrayChips = (field, dictPath) => {
      const arr = f[field] || [];
      arr.forEach((k) => {
        const dict = dictPath ? t?.[dictPath] : null;
        list.push({ field, val: k, label: dict?.[k] || k });
      });
    };

    addArrayChips("colorKeys", "colors");
    addArrayChips("styleKeys", "styles");
    addArrayChips("roomKeys", "rooms");
    addArrayChips("collectionKeys", "collections");

    return list;
  }, [activeFilters, t, lang]);

  const hasAnyActiveFilter = useMemo(() => {
    return Object.entries(activeFilters).some(([k, v]) => {
      if (k === "sort") return v && v !== "newest";
      if (typeof v === "boolean") return v;
      if (Array.isArray(v)) return v.length > 0;
      return String(v || "").trim() !== "";
    });
  }, [activeFilters]);

  // ✅ Показуємо loader якщо щось ще тягнеться
  if (loadingProducts || langLoading || categoriesLoading || trLoading) {
    return (
      <div className="loader-container">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="category-page-container">
      <header className="category-header">
        <h1 className="category-title">
          <span className="title-accent" />
          {subName}
        </h1>

        <div style={{ marginTop: 10 }}>
          <Link to={`/catalog/${encodeURIComponent(category)}`} className="dp-back-link">
            ← {lang === "ua" ? "Назад до підкатегорій" : "Back to subcategories"}
          </Link>
        </div>

        {/* якщо хочеш показувати parentName десь */}
        {/* <div className="dp-parent">{parentName}</div> */}
      </header>

      <ProductFiltersBar
        value={draftFilters}
        onChange={setDraftFilters}
        onApply={onApplyFilters}
        onReset={onResetFilters}
        loading={loadingProducts}
      />

      <ActiveChipsRow
        chips={activeChips}
        onReset={onResetFilters}
        onRemove={removeTag}
        resetText={lang === "ua" ? "Скинути всі" : "Reset all"}
      />

      <ProductsGrid
        products={products}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        apiUrl={API_ORIGIN}     // ✅ тільки origin, без /api
        category={category}
        subKey={subKey}
        lang={lang}
        hasAnyActiveFilter={hasAnyActiveFilter}
        q={q}
      />
    </div>
  );
}
