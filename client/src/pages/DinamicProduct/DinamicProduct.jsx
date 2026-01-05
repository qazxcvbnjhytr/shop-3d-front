import React, { useContext, useState, useEffect, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import axios from "axios";

import ProductFiltersBar from "./ProductFilters/ProductFiltersBar/ProductFiltersBar";
import ProductsGrid from "./ProductsGrid/ProductsGrid";
import ActiveChipsRow from "./ActiveChipsRow/ActiveChipsRow";

import { LanguageContext } from "../../context/LanguageContext";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";
import { useCategories } from "../../hooks/useCategories";
import { useTranslation } from "../../hooks/useTranslation";

// Імпорт винесених хелперів
import {
  DEFAULT_FILTERS,
  normalizeLang,
  pickText,
  readFiltersFromSearchParams,
  buildApiParams,
  filtersToSearchParamsObject
} from "./productHelpers";

import "./DinamicProduct.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
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
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [categoryChildren, setCategoryChildren] = useState([]);
  const [categoryParent, setCategoryParent] = useState(null);

  // Синхронізація локальних фільтрів з URL
  useEffect(() => {
    setDraftFilters((prev) => ({ ...prev, ...activeFilters }));
  }, [activeFilters]);

  // Завантаження інформації про категорії (батьківська + дочірні)
  useEffect(() => {
    if (!category) return;

    const fetchCategoryInfo = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/categories/${category}/children`, {
          params: { _ts: Date.now() },
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });

        setCategoryParent(res.data?.parent || null);
        setCategoryChildren(Array.isArray(res.data?.children) ? res.data.children : []);
      } catch {
        setCategoryParent(null);
        setCategoryChildren([]);
      }
    };

    fetchCategoryInfo();
  }, [category]);

  const parentName = useMemo(() => {
    const fromApi = pickText(categoryParent?.names, lang);
    if (fromApi) return fromApi;

    const item = categoriesMap?.[category];
    return pickText(item, lang) || pickText(item?.names, lang) || category || "";
  }, [category, categoriesMap, categoryParent, lang]);

  const subName = useMemo(() => {
    if (!subKey || subKey === "all") return lang === "ua" ? "Усі товари" : "All products";

    const fromChildren = categoryChildren.find((c) => c?.key === subKey);
    const childName = pickText(fromChildren?.names, lang);
    if (childName) return childName;

    const item = categoriesMap?.[subKey];
    const fromMap = pickText(item, lang) || pickText(item?.names, lang);
    if (fromMap) return fromMap;

    return subKey;
  }, [subKey, categoryChildren, categoriesMap, lang]);

  // Оновлення хлібних крихт
  useEffect(() => {
    setData?.((prev) => ({
      ...(prev || {}),
      categoryCode: category,
      subCategoryCode: subKey,
      productName: null,
    }));
  }, [category, subKey, setData]);

  // Основний запит на завантаження товарів
  useEffect(() => {
    if (!category) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const base = subKey && subKey !== "all" ? { category, subCategory: subKey } : { category };
        const params = buildApiParams(activeFilters, base);

        const res = await axios.get(`${API_URL}/api/products/filter`, {
          params: { ...params, _ts: Date.now() },
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });

        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Помилка завантаження товарів:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    setCurrentPage(1);
  }, [category, subKey, activeFilters]);

  const onApplyFilters = () => {
    const obj = filtersToSearchParamsObject(draftFilters);
    setSearchParams(obj, { replace: false });
    setCurrentPage(1);
  };

  const onResetFilters = () => {
    setDraftFilters({ ...DEFAULT_FILTERS });
    setSearchParams({}, { replace: false });
    setCurrentPage(1);
  };

  const removeTag = (field, valueToRemove) => {
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
  };

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

  if (loading || langLoading || categoriesLoading || trLoading) {
    return <div className="loader-container"><div className="loader" /></div>;
  }

  return (
    <div className="category-page-container">
      <header className="category-header">
        <h1 className="category-title">
          <span className="title-accent"></span>
          {subName}
        </h1>
        <div style={{ marginTop: 10 }}>
          <Link to={`/catalog/${encodeURIComponent(category)}`} className="dp-back-link">
            ← {lang === "ua" ? "Назад до підкатегорій" : "Back to subcategories"}
          </Link>
        </div>
      </header>

      <ProductFiltersBar
        value={draftFilters}
        onChange={setDraftFilters}
        onApply={onApplyFilters}
        onReset={onResetFilters}
        loading={loading}
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
        apiUrl={API_URL}
        category={category}
        subKey={subKey}
        lang={lang}
        hasAnyActiveFilter={hasAnyActiveFilter}
        q={q}
      />
    </div>
  );
}