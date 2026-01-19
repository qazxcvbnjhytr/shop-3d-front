// client/src/components/Breadcrumbs/Breadcrumbs.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { IoHomeSharp, IoChevronForward } from "react-icons/io5";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";
import { useTranslation } from "../../hooks/useTranslation";
import "./Breadcrumbs.css";


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

const API_BASE = `${normalizeOrigin(RAW_API)}${normalizePrefix(API_PREFIX)}`; 

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

// ✅ один стабільний endpoint
async function fetchProductById(productId, signal) {
  try {
    const res = await axios.get(`${API_BASE}/products/${encodeURIComponent(productId)}`, {
      signal,
      params: { _ts: Date.now() },
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      timeout: 20000,
    });
    const data = res?.data;
    const product = data?.product || data?.item || data;
    if (product && (product?._id || product?.id)) return product;
  } catch {
    // ignore
  }
  return null;
}

// ✅ намагаємось взяти children; якщо такого роуту нема — просто повернемо null
async function fetchCategoryChildren(categoryKey, signal) {
  if (!categoryKey) return null;
  try {
    const res = await axios.get(
      `${API_BASE}/categories/${encodeURIComponent(categoryKey)}/children`,
      { signal, timeout: 20000 }
    );
    return res.data;
  } catch {
    return null;
  }
}

export default function Breadcrumbs() {
  const location = useLocation();
  const bc = useBreadcrumbs();
  const data = bc?.data || {};
  const setData = bc?.setData;

  const { t, language } = useTranslation();
  const lang = normalizeLang(language);

  // ✅ УСІ hook-и до будь-яких return
  const pathname = location.pathname || "/";
  const segments = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);
  const isCatalogRoute = segments[0] === "catalog";

  const { categoryFromUrl, subFromUrl, productIdFromUrl } = useMemo(() => {
    if (!isCatalogRoute) return { categoryFromUrl: null, subFromUrl: null, productIdFromUrl: null };

    // /catalog/:category/:sub/:id
    if (segments.length >= 4) {
      return {
        categoryFromUrl: segments[1] || null,
        subFromUrl: segments[2] || null,
        productIdFromUrl: segments[3] || null,
      };
    }

    // /catalog/:category/:sub  OR  /catalog/:category/:id
    if (segments.length === 3) {
      return looksLikeMongoId(segments[2])
        ? { categoryFromUrl: segments[1] || null, subFromUrl: null, productIdFromUrl: segments[2] || null }
        : { categoryFromUrl: segments[1] || null, subFromUrl: segments[2] || null, productIdFromUrl: null };
    }

    // /catalog/:category  OR  /catalog/:id
    if (segments.length === 2) {
      return looksLikeMongoId(segments[1])
        ? { categoryFromUrl: null, subFromUrl: null, productIdFromUrl: segments[1] || null }
        : { categoryFromUrl: segments[1] || null, subFromUrl: null, productIdFromUrl: null };
    }

    return { categoryFromUrl: null, subFromUrl: null, productIdFromUrl: null };
  }, [isCatalogRoute, segments]);

  const [resolvedProduct, setResolvedProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(false);

  const [catTree, setCatTree] = useState(null);
  const [catLoading, setCatLoading] = useState(false);

  // ✅ Категорія -> діти (sub)
  useEffect(() => {
    if (!isCatalogRoute || !categoryFromUrl) {
      setCatTree(null);
      setCatLoading(false);
      return;
    }

    let alive = true;
    const controller = new AbortController();

    (async () => {
      setCatLoading(true);
      const tree = await fetchCategoryChildren(categoryFromUrl, controller.signal);
      if (!alive) return;
      setCatTree(tree || null);
      setCatLoading(false);
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [isCatalogRoute, categoryFromUrl]);

  // ✅ ProductId -> підтягуємо продукт, щоб знати назву/категорію/саб
  useEffect(() => {
    if (!isCatalogRoute || !productIdFromUrl || !looksLikeMongoId(productIdFromUrl)) {
      setResolvedProduct(null);
      setProductLoading(false);
      return;
    }

    let alive = true;
    const controller = new AbortController();

    (async () => {
      setProductLoading(true);
      const p = await fetchProductById(productIdFromUrl, controller.signal);
      if (!alive) return;

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
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [isCatalogRoute, productIdFromUrl, setData, lang, categoryFromUrl, subFromUrl]);

  const catalogLabel = pickText(t?.header?.catalog, lang) || "Catalog";

  const finalCategoryCode = useMemo(() => {
    if (!isCatalogRoute) return null;
    return resolvedProduct?.category || data?.categoryCode || categoryFromUrl || null;
  }, [isCatalogRoute, resolvedProduct, data?.categoryCode, categoryFromUrl]);

  const finalSubKey = useMemo(() => {
    if (!isCatalogRoute) return null;
    return resolvedProduct?.subCategory || data?.subCategoryKey || subFromUrl || null;
  }, [isCatalogRoute, resolvedProduct, data?.subCategoryKey, subFromUrl]);

  const finalProductName = useMemo(() => {
    if (!isCatalogRoute) return null;
    return data?.productName || pickProductName(resolvedProduct, lang) || null;
  }, [isCatalogRoute, data?.productName, resolvedProduct, lang]);

  const categoryLabel = useMemo(() => {
    if (!finalCategoryCode) return null;

    // якщо бекенд віддає { parent: { names }, children: [] }
    const fromDb = pickText(catTree?.parent?.names, lang);

    return (
      fromDb ||
      pickText(t?.catalogPage?.categories?.[finalCategoryCode], lang) ||
      humanize(finalCategoryCode)
    );
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
      favorites: t?.header?.favorites,
      collections: t?.header?.collections,
    };

    return pickText(map[first], lang) || humanize(first);
  }, [isCatalogRoute, segments, t, lang]);

  // ✅ на головній хлібні крихти не потрібні
  if (pathname === "/") return null;

  const productCrumbText = finalProductName || (productLoading ? "…" : null);
  const shouldShowSubCrumb = Boolean(finalCategoryCode && finalSubKey);
  const shouldShowProductCrumb = Boolean(productIdFromUrl && looksLikeMongoId(productIdFromUrl));

  return (
    <div className="breadcrumbs-wrapper">
      <div className="breadcrumbs-bg">
        <div className="breadcrumbs">
          <span className="crumb home-crumb">
            <Link to="/">
              <IoHomeSharp className="home-icon" />
            </Link>
            <span className="separator">
              <IoChevronForward />
            </span>
          </span>

          {!isCatalogRoute && (
            <span className="crumb current">
              <span className="current-page-name">{pageLabel}</span>
            </span>
          )}

          {isCatalogRoute && (
            <>
              <span className="crumb link-crumb">
                <Link to="/catalog">{catalogLabel}</Link>
                {(finalCategoryCode || shouldShowSubCrumb || shouldShowProductCrumb) && (
                  <span className="separator">
                    <IoChevronForward />
                  </span>
                )}
              </span>

              {finalCategoryCode && (
                <span className="crumb link-crumb">
                  <Link to={`/catalog/${finalCategoryCode}`}>{categoryLabel}</Link>
                  {(shouldShowSubCrumb || shouldShowProductCrumb) && (
                    <span className="separator">
                      <IoChevronForward />
                    </span>
                  )}
                </span>
              )}

              {shouldShowSubCrumb && (
                <span className={`crumb ${shouldShowProductCrumb ? "link-crumb" : "current"}`}>
                  {shouldShowProductCrumb ? (
                    <>
                      <Link to={`/catalog/${finalCategoryCode}/${finalSubKey}`}>{subLabel}</Link>
                      <span className="separator">
                        <IoChevronForward />
                      </span>
                    </>
                  ) : (
                    <span className="current-page-name">{catLoading && !subLabel ? "…" : subLabel}</span>
                  )}
                </span>
              )}

              {shouldShowProductCrumb && productCrumbText && (
                <span className="crumb current">
                  <span className="current-page-name">{productCrumbText}</span>
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
