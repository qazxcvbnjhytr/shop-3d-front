// client/src/pages/Home/PopularCategories/PopularCategories.jsx
import React, { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "../../../context/LanguageContext";
import "./PopularCategories.css";

// ✅ env-first (без localhost fallback)
const RAW_API = import.meta.env.VITE_API_URL;

const normalizeOrigin = (url) => String(url || "").replace(/\/+$/, "");
const stripApiSuffix = (origin) => String(origin || "").replace(/\/api\/?$/, "");

// Якщо в env вказали https://host/api — прибираємо /api
const API_ORIGIN = stripApiSuffix(normalizeOrigin(RAW_API));

if (!RAW_API) {
  throw new Error("Missing VITE_API_URL in client/.env(.local)");
}

// ✅ коректний join для локальних шляхів /img/... і зовнішніх http(s) URL
const joinUrl = (origin, raw) => {
  if (!raw || typeof raw !== "string") return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;
  const o = String(origin || "").replace(/\/+$/, "");
  const p = raw.startsWith("/") ? raw : `/${raw}`;
  return `${o}${p}`;
};

const normalizeLang = (lang) => (lang === "uk" ? "ua" : (lang || "ua"));

const pickText = (val, lang = "ua") => {
  const L = normalizeLang(lang);
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "object") return String(val?.[L] ?? val?.ua ?? val?.en ?? "");
  return "";
};

export default function PopularCategories({ items = [] }) {
  const { translations, language } = useContext(LanguageContext);

  const tHome = translations?.home || {};
  const lang = useMemo(() => normalizeLang(language), [language]);

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="pc">
      <div className="pc__head">
        <h2 className="pc__h2">{tHome.popularTitle || "Popular Categories"}</h2>

        <Link className="pc__link" to="/catalog">
          {tHome.gotoCatalog || "All Categories"} →
        </Link>
      </div>

      <div className="pc__grid">
        {items.map((cat, idx) => {
          const key = String(cat?._id?.$oid || cat?._id || cat?.category || idx);

          const label =
            pickText(cat?.names, lang) ||
            String(cat?.category || (lang === "ua" ? "Категорія" : "Category"));

          const bgImage = joinUrl(API_ORIGIN, cat?.image);

          return (
            <Link
              key={key}
              to={`/catalog/${encodeURIComponent(String(cat?.category || ""))}`}
              className="pc__tile"
              style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
              aria-label={label}
              title={label}
            >
              <div className="pc__overlay" />

              <div className="pc__content">
                <div className="pc__title">{label}</div>
                <div className="pc__hint">{tHome.viewCategory || "View"}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
