import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "../../hooks/useTranslation";
import axios from "axios";
import "./Catalog.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const normalizeLang = (lang) => (lang === "uk" ? "ua" : (lang || "ua"));

const pickText = (val, lang = "ua") => {
  lang = normalizeLang(lang);
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);
  return String(val?.[lang] ?? val?.ua ?? val?.en ?? "");
};

const getCategoryImg = (src) => {
  if (!src) return "/placeholder.png";
  if (String(src).startsWith("http")) return src;
  return `${API_URL}${String(src).startsWith("/") ? "" : "/"}${src}`;
};

export default function Catalog() {
  const { t, loading, language } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const catalogTexts = t?.catalogPage || {};
  const lang = normalizeLang(language);
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setError("");
        const res = await axios.get(`${API_URL}/api/categories`);
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error loading categories", err);
        setError("Failed to load categories");
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    if (!q) return list;
    return list.filter((c) => {
      const name = (pickText(c?.names, lang) || c?.category || "").toLowerCase();
      return name.includes(q);
    });
  }, [categories, q, lang]);

  if (loading) return <div className="c-state">Loading…</div>;

  return (
    <section className="c-page">
      <div className="c-wrap">
        <header className="c-head">
          <div className="c-head__left">
            <h1 className="c-title">{pickText(catalogTexts.catalog, lang) || "Catalog"}</h1>
            <p className="c-sub">
              {pickText(catalogTexts.generalText, lang) ||
                "Choose a category to explore products with photos and 3D viewing."}
            </p>
          </div>

          {q ? (
            <div className="c-chip">
              Results: <span className="c-chip__strong">{q}</span>
            </div>
          ) : null}
        </header>

        {error ? <div className="c-alert">{error}</div> : null}

        <div className="c-grid">
          {filtered.length ? (
            filtered.map((item, idx) => {
              const id = item?._id?.$oid || item?._id || idx;
              const title = pickText(item?.names, lang) || item?.category || "Category";
              const img = getCategoryImg(item?.image);

              return (
                <button
                  key={id}
                  type="button"
                  className="c-card"
                  onClick={() => navigate(`/catalog/${item.category}`)}
                  title={title}
                >
                  <div className="c-card__media">
                    <img className="c-card__img" src={img} alt={title} loading="lazy" />
                  </div>

                  <div className="c-card__meta">
                    <div className="c-card__name">{title}</div>
                    <div className="c-card__cta">Explore</div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="c-empty">
              {q ? "Nothing found" : pickText(catalogTexts.noProducts, lang) || "No categories yet"}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
