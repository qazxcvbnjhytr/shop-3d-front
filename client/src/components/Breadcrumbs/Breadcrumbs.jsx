import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { IoHomeSharp, IoChevronForward } from "react-icons/io5";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";
import { useTranslation } from "../../hooks/useTranslation";
import "./Breadcrumbs.css";

export default function Breadcrumbs() {
  const location = useLocation();
  const { data = {} } = useBreadcrumbs();
  const { t } = useTranslation();

  if (location.pathname === "/") return null;

  const pathname = location.pathname || "/";
  const segments = useMemo(() => pathname.split("/").filter(Boolean), [pathname]);
  const isCatalogRoute = segments[0] === "catalog";

  const catalogLabel = t?.header?.catalog || "Catalog";
  const categories = t?.catalogPage?.categories || {};

  // ✅ тільки для /catalog...
  const categoryCode = isCatalogRoute ? (data.categoryCode || segments[1] || null) : null;
  const productName = isCatalogRoute ? (data.productName || null) : null;

  const categoryLabel =
    categoryCode &&
    (categories[categoryCode] ||
      categoryCode.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()));

  // ✅ назви статичних сторінок — ТІЛЬКИ з твоєї БД (t.header.*)
  const pageLabel = useMemo(() => {
    if (isCatalogRoute) return null;

    const first = segments[0] || "";

    const map = {
      catalog: t?.header?.catalog,
      whereToBuy: t?.header?.whereToBuy,
      news: t?.header?.news,
      contacts: t?.header?.contacts,
      about: t?.header?.about,
      requestPrice: t?.header?.requestPrice,
      downloadCatalog: t?.header?.downloadCatalog,
      admin: t?.header?.adminPanel,
      account: t?.header?.account,
      login: t?.header?.login,
      register: t?.auth?.register, // якщо є, інакше fallback нижче
    };

    return (
      map[first] ||
      first.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase())
    );
  }, [isCatalogRoute, segments, t]);

  return (
    <div className="breadcrumbs-wrapper">
      <div className="breadcrumbs-bg">
        <div className="breadcrumbs">
          {/* HOME */}
          <span className="crumb home-crumb">
            <Link to="/">
              <IoHomeSharp className="home-icon" />
            </Link>
            <span className="separator">
              <IoChevronForward />
            </span>
          </span>

          {/* ✅ НЕ КАТАЛОГ */}
          {!isCatalogRoute && (
            <span className="crumb current">
              <span className="current-page-name">{pageLabel}</span>
            </span>
          )}

          {/* ✅ КАТАЛОГ */}
          {isCatalogRoute && (
            <>
              <span className="crumb link-crumb">
                <Link to="/catalog">{catalogLabel}</Link>
                {(categoryCode || productName) && (
                  <span className="separator">
                    <IoChevronForward />
                  </span>
                )}
              </span>

              {categoryCode && (
                <span className="crumb link-crumb">
                  <Link to={`/catalog/${categoryCode}`}>{categoryLabel}</Link>
                  {productName && (
                    <span className="separator">
                      <IoChevronForward />
                    </span>
                  )}
                </span>
              )}

              {productName && (
                <span className="crumb current">
                  <span className="current-page-name">{productName}</span>
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
