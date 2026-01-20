// client/src/components/Breadcrumbs/Breadcrumbs.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { IoHomeSharp, IoChevronForward } from "react-icons/io5";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";
import { useTranslation } from "../../hooks/useTranslation";
import "./Breadcrumbs.css";

// --- API CONFIGURATION ---
const RAW_API = import.meta.env.VITE_API_URL;
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";

if (!RAW_API) throw new Error("Missing VITE_API_URL in client/.env(.local)");

const normalizeOrigin = (url) => String(url || "").replace(/\/+$/, "");
const normalizePrefix = (p) => {
  const s = String(p || "/api").trim();
  return s.startsWith("/") ? s.replace(/\/+$/, "") : `/${s.replace(/\/+$/, "")}`;
};

const API_BASE = `${normalizeOrigin(RAW_API)}${normalizePrefix(API_PREFIX)}`;

// --- HELPERS ---
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

// --- API CALLS ---
async function fetchProductById(productId, signal) {
  try {
    const res = await axios.get(`${API_BASE}/products/${encodeURIComponent(productId)}`, {
      signal,
      headers: { "Cache-Control": "no-cache" }, // Removed timestamp param to allow browser caching if needed
      timeout: 10000,
    });
    const data = res?.data;
    const product = data?.product || data?.item || data;
    return (product?._id || product?.id) ? product : null;
  } catch (error) {
    if (axios.isCancel(error)) return null;
    console.error("Breadcrumbs product fetch failed", error);
    return null;
  }
}

async function fetchCategoryChildren(categoryKey, signal) {
  if (!categoryKey) return null;
  try {
    const res = await axios.get(
      `${API_BASE}/categories/${encodeURIComponent(categoryKey)}/children`,
      { signal, timeout: 10000 }
    );
    return res.data;
  } catch (error) {
    if (axios.isCancel(error)) return null;
    return null;
  }
}

export default function Breadcrumbs() {
  const location = useLocation();
  const { data, setData } = useBreadcrumbs() || {}; // Safe access if hook returns null
  const { t, language } = useTranslation();
  const lang = normalizeLang(language);

  const pathname = location.pathname || "/";
  const segments = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);
  const isCatalogRoute = segments[0] === "catalog";

  // --- ROUTE PARSING ---
  const routeParams = useMemo(() => {
    if (!isCatalogRoute) return { category: null, sub: null, productId: null };

    // Standardize parsing regardless of length
    // Strategy: Look for ID at the end, then backfill
    const lastSegment = segments[segments.length - 1];
    const hasId = looksLikeMongoId(lastSegment);
    
    let category = segments[1] || null;
    let sub = segments[2] || null;
    let productId = null;

    if (hasId) {
      productId = lastSegment;
      // Adjust if URL is shorter, e.g., /catalog/id or /catalog/cat/id
      if (segments.length === 2) { category = null; sub = null; } // /catalog/:id
      if (segments.length === 3) { sub = null; } // /catalog/:cat/:id
    } else {
        // No ID, so it's a category or subcategory page
        // /catalog/:cat/:sub
    }

    return { category, sub, productId };
  }, [isCatalogRoute, segments]);

  const { category: categoryFromUrl, sub: subFromUrl, productId: productIdFromUrl } = routeParams;

  // --- STATE ---
  const [resolvedProduct, setResolvedProduct] = useState(null);
  const [catTree, setCatTree] = useState(null);
  const [loading, setLoading] = useState({ product: false, category: false });

  // --- EFFECTS ---

  // 1. Fetch Category Tree
  useEffect(() => {
    if (!isCatalogRoute || !categoryFromUrl) {
      setCatTree(null);
      return;
    }

    const controller = new AbortController();
    setLoading(prev => ({ ...prev, category: true }));

    fetchCategoryChildren(categoryFromUrl, controller.signal)
      .then(tree => setCatTree(tree))
      .finally(() => setLoading(prev => ({ ...prev, category: false })));

    return () => controller.abort();
  }, [isCatalogRoute, categoryFromUrl]);

  // 2. Fetch Product
  useEffect(() => {
    if (!isCatalogRoute || !productIdFromUrl) {
      setResolvedProduct(null);
      return;
    }

    const controller = new AbortController();
    setLoading(prev => ({ ...prev, product: true }));

    fetchProductById(productIdFromUrl, controller.signal)
      .then(p => {
        if (p) {
          setResolvedProduct(p);
          // Optional: Update Context if needed elsewhere, strictly checking for changes to avoid loops
          if (setData) {
             setData(prev => {
                const newName = pickProductName(p, lang);
                if (prev.productName === newName) return prev;
                return { 
                    ...prev, 
                    categoryCode: p.category || categoryFromUrl,
                    subCategoryKey: p.subCategory || subFromUrl,
                    productName: newName
                };
             });
          }
        }
      })
      .finally(() => setLoading(prev => ({ ...prev, product: false })));

    return () => controller.abort();
  }, [isCatalogRoute, productIdFromUrl, lang, setData, categoryFromUrl, subFromUrl]);

  // --- LABEL RESOLUTION ---
  
  // Resolve Category Label
  const finalCategoryCode = resolvedProduct?.category || data?.categoryCode || categoryFromUrl;
  const categoryLabel = useMemo(() => {
    if (!finalCategoryCode) return null;
    const fromDb = pickText(catTree?.parent?.names, lang);
    return fromDb || pickText(t?.catalogPage?.categories?.[finalCategoryCode], lang) || humanize(finalCategoryCode);
  }, [finalCategoryCode, catTree, t, lang]);

  // Resolve Subcategory Label
  const finalSubKey = resolvedProduct?.subCategory || data?.subCategoryKey || subFromUrl;
  const subLabel = useMemo(() => {
    if (!finalSubKey) return null;
    if (finalSubKey === "all") return lang === "ua" ? "Усі товари" : "All products";
    const hit = (catTree?.children || []).find((c) => String(c?.key) === String(finalSubKey));
    return pickText(hit?.names, lang) || humanize(finalSubKey);
  }, [finalSubKey, catTree, lang]);

  // Resolve Product Label
  const finalProductName = data?.productName || pickProductName(resolvedProduct, lang);

  // --- BREADCRUMB ARRAY GENERATION ---
  
  const breadcrumbs = useMemo(() => {
    if (pathname === "/") return [];
    
    const crumbs = [];

    // 1. Home
    crumbs.push({
      key: 'home',
      content: <Link to="/"><IoHomeSharp className="home-icon" /></Link>
    });

    if (!isCatalogRoute) {
      // Static Pages
      const first = segments[0] || "";
      const map = {
        "where-to-buy": t?.header?.whereToBuy,
        "news": t?.header?.news,
        "contacts": t?.header?.contacts,
        "about": t?.header?.about,
        "shopping-cart": t?.header?.cart,
        "favorites": t?.header?.favorites,
        // ... add others
      };
      const label = pickText(map[first], lang) || humanize(first);
      crumbs.push({ key: 'static', label, isCurrent: true });
    } else {
      // Catalog Pages
      crumbs.push({ 
        key: 'catalog-root', 
        label: pickText(t?.header?.catalog, lang) || "Catalog", 
        to: "/catalog" 
      });

      if (finalCategoryCode) {
        crumbs.push({
          key: 'category',
          label: categoryLabel,
          to: `/catalog/${finalCategoryCode}`,
          isCurrent: !finalSubKey && !productIdFromUrl
        });
      }

      if (finalSubKey) {
        crumbs.push({
          key: 'subcategory',
          label: loading.category && !subLabel ? "…" : subLabel,
          to: `/catalog/${finalCategoryCode}/${finalSubKey}`,
          isCurrent: !productIdFromUrl
        });
      }

      if (productIdFromUrl) {
        crumbs.push({
          key: 'product',
          label: finalProductName || (loading.product ? "…" : null),
          isCurrent: true
        });
      }
    }

    return crumbs;
  }, [pathname, isCatalogRoute, segments, t, lang, finalCategoryCode, categoryLabel, finalSubKey, subLabel, loading, finalProductName, productIdFromUrl]);

  if (pathname === "/") return null;

  return (
    <div className="breadcrumbs-wrapper">
      <div className="breadcrumbs-bg">
        <div className="breadcrumbs">
          {breadcrumbs.map((crumb, index) => {
            if (!crumb.label && !crumb.content) return null;
            
            const isLast = index === breadcrumbs.length - 1;

            return (
              <span key={crumb.key} className={`crumb ${crumb.isCurrent ? 'current' : 'link-crumb'}`}>
                {/* Render Link or Text */}
                {crumb.content ? crumb.content : (
                    crumb.to && !crumb.isCurrent ? (
                        <Link to={crumb.to}>{crumb.label}</Link>
                    ) : (
                        <span className="current-page-name">{crumb.label}</span>
                    )
                )}

                {/* Render Separator if not last */}
                {!isLast && (
                  <span className="separator">
                    <IoChevronForward />
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}