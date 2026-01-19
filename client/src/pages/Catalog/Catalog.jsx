// client/src/pages/Catalog/Catalog.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "../../hooks/useTranslation";
import "./Catalog.css";

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
const API_BASE = `${API_ORIGIN}${normalizePrefix(API_PREFIX)}`; 

const normalizeLang = (lang) => (lang === "uk" ? "ua" : (lang || "ua"));

const pickText = (val, lang = "ua") => {
  lang = normalizeLang(lang);
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "object") return String(val?.[lang] ?? val?.ua ?? val?.en ?? "");
  return String(val);
};

const joinUrl = (origin, raw) => {
  if (!raw) return "/placeholder.png";
  const s = String(raw).trim();
  if (!s) return "/placeholder.png";
  if (/^(https?:\/\/|data:|blob:)/i.test(s)) return s;

  const o = String(origin || "").replace(/\/+$/, "");
  const p = s.startsWith("/") ? s : `/${s}`;
  return `${o}${p}`;
};

export default function Catalog() {
  const { t, loading: langLoading, language } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const lang = normalizeLang(language);
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const catalogTexts = t?.catalogPage || {};

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        setError("");
        setLoadingCats(true);

        const res = await axios.get(`${API_BASE}/categories`, {
          params: { lang, _ts: Date.now() }, // ✅ щоб не кешувалося агресивно
          signal: controller.signal,
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          timeout: 20000,
        });

        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.items) ? res.data.items : []);
        if (alive) setCategories(list);
      } catch (err) {
        if (!alive) return;
        if (axios.isCancel?.(err)) return;
        console.error("[Catalog] categories load error:", err);
        setCategories([]);
        setError(err?.response?.data?.message || err?.message || "Failed to load categories");
      } finally {
        if (alive) setLoadingCats(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [lang]);

  const filtered = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    if (!q) return list;

    return list.filter((c) => {
      const name = (pickText(c?.names, lang) || c?.category || "").toLowerCase();
      return name.includes(q);
    });
  }, [categories, q, lang]);

  if (langLoading) return <div className="c-state">Loading…</div>;

  const title = pickText(catalogTexts.catalog, lang) || "Catalog";
  const subtitle =
    pickText(catalogTexts.generalText, lang) ||
    "Choose a category to explore products with photos and 3D viewing.";

  return (
    <section className="c-page">
      <div className="c-wrap">
        <header className="c-head">
          <div className="c-head__left">
            <h1 className="c-title">{title}</h1>
            <p className="c-sub">{subtitle}</p>
          </div>

          {q ? (
            <div className="c-chip">
              Results: <span className="c-chip__strong">{q}</span>
            </div>
          ) : null}
        </header>

        {error ? <div className="c-alert">{error}</div> : null}

        {loadingCats ? (
          <div className="c-state">Loading…</div>
        ) : (
          <div className="c-grid">
            {filtered.length ? (
              filtered.map((item, idx) => {
                const id = item?._id?.$oid || item?._id || item?.category || idx;
                const name = pickText(item?.names, lang) || item?.category || "Category";
                const img = joinUrl(API_ORIGIN, item?.image);

                return (
                  <button
                    key={String(id)}
                    type="button"
                    className="c-card"
                    onClick={() => navigate(`/catalog/${item.category}`)}
                    title={name}
                  >
                    <div className="c-card__media">
                      <img
                        className="c-card__img"
                        src={img}
                        alt={name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.png";
                        }}
                      />
                    </div>

                    <div className="c-card__meta">
                      <div className="c-card__name">{name}</div>
                      <div className="c-card__cta">{lang === "ua" ? "Перейти" : "Explore"}</div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="c-empty">
                {q ? (lang === "ua" ? "Нічого не знайдено" : "Nothing found") : (pickText(catalogTexts.noProducts, lang) || "No categories yet")}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
