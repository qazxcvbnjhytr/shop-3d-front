// client/src/pages/Catalog/Catalog.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "../../hooks/useTranslation";
import "./Catalog.css";

const RAW_API = import.meta.env.VITE_API_URL;
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";

// Надійне склеювання URL
const getFullImageUrl = (imagePath) => {
  if (!imagePath) return "/placeholder.png";
  if (/^(https?:\/\/|data:|blob:)/i.test(imagePath)) return imagePath;

  const base = String(RAW_API || "http://localhost:5000").replace(/\/+$/, "");
  const path = String(imagePath).startsWith("/") ? imagePath : `/${imagePath}`;
  
  return `${base}${path}`;
};

const normalizeLang = (lang) => (lang === "uk" ? "ua" : (lang || "ua"));
const pickText = (val, lang = "ua") => {
  lang = normalizeLang(lang);
  if (!val) return "";
  if (typeof val === "object") return val[lang] || val.ua || val.en || "";
  return String(val);
};

export default function Catalog() {
  const { t, loading: langLoading, language } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = normalizeLang(language);
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    (async () => {
      try {
        setLoadingCats(true);
        const res = await axios.get(`${RAW_API}${API_PREFIX}/categories`, {
          params: { lang, _ts: Date.now() },
          signal: controller.signal,
        });
        const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        if (alive) setCategories(list);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        if (alive) setLoadingCats(false);
      }
    })();
    return () => { alive = false; controller.abort(); };
  }, [lang]);

  const filtered = useMemo(() => {
    if (!q) return categories;
    return categories.filter(c => pickText(c.names, lang).toLowerCase().includes(q));
  }, [categories, q, lang]);

  if (langLoading) return <div className="c-full-loader">MebliHub</div>;

  return (
    <main className="c-page">
      <div className="c-wrap">
        <header className="c-head">
          <div className="c-head__content">
            <h1 className="c-title">{pickText(t?.catalogPage?.catalog, lang) || "Catalog"}</h1>
            <p className="c-sub">{pickText(t?.catalogPage?.generalText, lang) || "Selection of premium furniture."}</p>
          </div>
        </header>

        <div className="c-grid">
          {loadingCats ? (
            [...Array(6)].map((_, i) => <div key={i} className="c-skeleton" />)
          ) : filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const name = pickText(item.names, lang) || item.category;
              const index = String(idx + 1).padStart(2, '0');
              const imageUrl = getFullImageUrl(item.image);
              
              return (
                <div 
                  key={item._id || idx} 
                  className="c-card"
                  onClick={() => navigate(`/catalog/${item.category}`)}
                >
                  <div className="c-card__visual">
                    <img
                      className="c-card__img"
                      src={imageUrl}
                      alt={name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.png"; // Перевір чи є цей файл в public!
                        e.currentTarget.classList.add('is-error');
                      }}
                    />
                    <div className="c-card__bg-num">{index}</div>
                  </div>
                  
                  <div className="c-card__footer">
                    <div className="c-card__label">
                      <span className="c-card__idx">{index}/</span>
                      <h3 className="c-card__name">{name}</h3>
                    </div>
                    <div className="c-card__arrow">→</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="c-empty">No categories.</div>
          )}
        </div>
      </div>
    </main>
  );
}