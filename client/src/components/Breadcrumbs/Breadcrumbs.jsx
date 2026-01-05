import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { IoHomeSharp, IoChevronForward } from "react-icons/io5";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";
import { useTranslation } from "../../hooks/useTranslation";
import "./Breadcrumbs.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const looksLikeMongoId = (v) => typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);
const normalizeLang = (lang) => (lang === "uk" ? "ua" : (lang || "ua"));

const pickText = (val, lang = "ua") => {
  lang = normalizeLang(lang);
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "object") return String(val?.[lang] ?? val?.ua ?? val?.en ?? "");
  return "";
};

const humanize = (s) =>
  String(s || "")
    .replace(/-/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const pickProductName = (p, language) => pickText(p?.name, language) || null;

async function fetchProductById(productId, signal) {
  const urls = [
    `${API_URL}/api/products/${productId}`,
    `${API_URL}/api/product/${productId}`,
  ];
  for (const url of urls) {
    try {
      const res = await axios.get(url, { signal, params: { _ts: Date.now() } });
      const data = res?.data;
      const product = data?.product || data?.item || data;
      if (product && (product?._id || product?.id)) return product;
    } catch { continue; }
  }
  return null;
}

async function fetchCategoryChildren(categoryKey, signal) {
  if (!categoryKey) return null;
  try {
    const res = await axios.get(`${API_URL}/api/categories/${encodeURIComponent(categoryKey)}/children`, { signal });
    return res.data;
  } catch { return null; }
}

export default function Breadcrumbs() {
  const location = useLocation();
  const bc = useBreadcrumbs();
  const data = bc?.data || {};
  const setData = bc?.setData;
  const { t, language } = useTranslation();
  const lang = normalizeLang(language);

  // 1. УСІ ХУКИ МАЮТЬ БУТИ ТУТ (до будь-яких if/return)
  const pathname = location.pathname || "/";
  const segments = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);
  const isCatalogRoute = segments[0] === "catalog";

  const { categoryFromUrl, subFromUrl, productIdFromUrl } = useMemo(() => {
    if (!isCatalogRoute) return { categoryFromUrl: null, subFromUrl: null, productIdFromUrl: null };
    if (segments.length >= 4) return { categoryFromUrl: segments[1], subFromUrl: segments[2], productIdFromUrl: segments[3] };
    if (segments.length === 3) {
      return looksLikeMongoId(segments[2]) 
        ? { categoryFromUrl: segments[1], subFromUrl: null, productIdFromUrl: segments[2] }
        : { categoryFromUrl: segments[1], subFromUrl: segments[2], productIdFromUrl: null };
    }
    if (segments.length === 2) {
      return looksLikeMongoId(segments[1])
        ? { categoryFromUrl: null, subFromUrl: null, productIdFromUrl: segments[1] }
        : { categoryFromUrl: segments[1], subFromUrl: null, productIdFromUrl: null };
    }
    return { categoryFromUrl: null, subFromUrl: null, productIdFromUrl: null };
  }, [isCatalogRoute, segments]);

  const [resolvedProduct, setResolvedProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [catTree, setCatTree] = useState(null);
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => {
    if (!isCatalogRoute || !categoryFromUrl) {
      setCatTree(null);
      return;
    }
    let alive = true;
    const controller = new AbortController();
    (async () => {
      setCatLoading(true);
      const tree = await fetchCategoryChildren(categoryFromUrl, controller.signal);
      if (alive) {
        setCatTree(tree || null);
        setCatLoading(false);
      }
    })();
    return () => { alive = false; controller.abort(); };
  }, [isCatalogRoute, categoryFromUrl]);

  useEffect(() => {
    if (!isCatalogRoute || !productIdFromUrl || !looksLikeMongoId(productIdFromUrl)) {
      setResolvedProduct(null);
      return;
    }
    let alive = true;
    const controller = new AbortController();
    (async () => {
      setProductLoading(true);
      const p = await fetchProductById(productIdFromUrl, controller.signal);
      if (alive) {
        setResolvedProduct(p || null);
        setProductLoading(false);
        if (p && typeof setData === "function") {
          setData((prev) => ({
            ...prev,
            categoryCode: p?.category || categoryFromUrl,
            subCategoryKey: p?.subCategory || subFromUrl,
            productName: pickProductName(p, lang),
          }));
        }
      }
    })();
    return () => { alive = false; controller.abort(); };
  }, [isCatalogRoute, productIdFromUrl, setData, lang, categoryFromUrl, subFromUrl]);

  const catalogLabel = pickText(t?.header?.catalog, lang) || "Catalog";

  const finalCategoryCode = useMemo(() => {
    return isCatalogRoute ? (resolvedProduct?.category || data?.categoryCode || categoryFromUrl || null) : null;
  }, [isCatalogRoute, resolvedProduct, data?.categoryCode, categoryFromUrl]);

  const finalSubKey = useMemo(() => {
    return isCatalogRoute ? (resolvedProduct?.subCategory || data?.subCategoryKey || subFromUrl || null) : null;
  }, [isCatalogRoute, resolvedProduct, data?.subCategoryKey, subFromUrl]);

  const finalProductName = useMemo(() => {
    if (!isCatalogRoute) return null;
    return data?.productName || pickProductName(resolvedProduct, lang) || null;
  }, [isCatalogRoute, data?.productName, resolvedProduct, lang]);

  const categoryLabel = useMemo(() => {
    if (!finalCategoryCode) return null;
    const fromDb = pickText(catTree?.parent?.names, lang);
    return fromDb || pickText(t?.catalogPage?.categories?.[finalCategoryCode], lang) || humanize(finalCategoryCode);
  }, [finalCategoryCode, catTree, t, lang]);

  const subLabel = useMemo(() => {
    if (!finalSubKey) return null;
    if (finalSubKey === "all") return lang === "ua" ? "Усі товари" : "All products";
    const hit = (catTree?.children || []).find((c) => String(c?.key) === String(finalSubKey));
    return pickText(hit?.names, lang) || humanize(finalSubKey);
  }, [finalSubKey, catTree, lang]);

  const pageLabel = useMemo(() => {
    if (isCatalogRoute) return null;
    const first = segments[0] || "";
    const map = {
      "where-to-buy": t?.header?.whereToBuy,
      news: t?.header?.news,
      contacts: t?.header?.contacts,
      about: t?.header?.about,
      account: t?.header?.account,
      "shopping-cart": t?.header?.cart,
    };
    return pickText(map[first], lang) || humanize(first);
  }, [isCatalogRoute, segments, t, lang]);

  // 2. ПЕРЕВІРКА НА ГОЛОВНУ СТОРІНКУ ПЕРЕД RETURN
  if (location.pathname === "/") return null;

  const productCrumbText = finalProductName || (productLoading ? "…" : null);
  const shouldShowSubCrumb = Boolean(finalCategoryCode && finalSubKey);
  const shouldShowProductCrumb = Boolean(productIdFromUrl && looksLikeMongoId(productIdFromUrl));

  return (
    <div className="breadcrumbs-wrapper">
      <div className="breadcrumbs-bg">
        <div className="breadcrumbs">
          <span className="crumb home-crumb">
            <Link to="/"><IoHomeSharp className="home-icon" /></Link>
            <span className="separator"><IoChevronForward /></span>
          </span>

          {!isCatalogRoute && (
            <span className="crumb current"><span className="current-page-name">{pageLabel}</span></span>
          )}

          {isCatalogRoute && (
            <>
              <span className="crumb link-crumb">
                <Link to="/catalog">{catalogLabel}</Link>
                {(finalCategoryCode || shouldShowSubCrumb || shouldShowProductCrumb) && <span className="separator"><IoChevronForward /></span>}
              </span>

              {finalCategoryCode && (
                <span className="crumb link-crumb">
                  <Link to={`/catalog/${finalCategoryCode}`}>{categoryLabel}</Link>
                  {(shouldShowSubCrumb || shouldShowProductCrumb) && <span className="separator"><IoChevronForward /></span>}
                </span>
              )}

              {shouldShowSubCrumb && (
                <span className={`crumb ${shouldShowProductCrumb ? "link-crumb" : "current"}`}>
                  {shouldShowProductCrumb ? (
                    <><Link to={`/catalog/${finalCategoryCode}/${finalSubKey}`}>{subLabel}</Link><span className="separator"><IoChevronForward /></span></>
                  ) : (
                    <span className="current-page-name">{catLoading && !subLabel ? "…" : subLabel}</span>
                  )}
                </span>
              )}

              {shouldShowProductCrumb && productCrumbText && (
                <span className="crumb current"><span className="current-page-name">{productCrumbText}</span></span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}