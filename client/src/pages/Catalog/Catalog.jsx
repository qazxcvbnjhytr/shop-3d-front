import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "../../hooks/useTranslation";
import axios from "axios";
import "./Catalog.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Хелпери
const normalizeLang = (lang) => (lang === "uk" ? "ua" : (lang || "ua"));

const pickText = (val, lang = "ua") => {
  lang = normalizeLang(lang);
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "object") return String(val?.[lang] ?? val?.ua ?? val?.en ?? "");
  return "";
};

const getCategoryKey = (category, language) => pickText(category?.category, language).trim();

const getCategoryDisplayName = (category, language) => {
  const lang = normalizeLang(language);
  return pickText(category?.names, lang) || pickText(category?.category, lang) || "";
};

export default function Catalog() {
  const { t, loading, language } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const catalogTexts = t?.catalogPage;
  const lang = normalizeLang(language);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/categories`, { withCredentials: true });
        const list = Array.isArray(res.data) ? res.data : [];
        const cleaned = list.filter((c) => {
          const key = getCategoryKey(c, lang);
          return key && !key.includes("..");
        });
        setCategories(cleaned);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    })();
  }, [lang]);

  const filtered = useMemo(() => {
    if (!q) return categories;
    return categories.filter((item) => getCategoryDisplayName(item, lang).toLowerCase().includes(q));
  }, [categories, q, lang]);

  if (loading || !catalogTexts) return <div className="catalog-loading">Завантаження...</div>;

  const handleCategoryClick = (categoryKey) => {
    if (!categoryKey) return;
    navigate(`/catalog/${encodeURIComponent(categoryKey)}`);
  };

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h2 className="catalog-title">{pickText(catalogTexts.catalog, lang) || "Каталог"}</h2>
      </div>

      <div className="catalog-grid">
        {filtered.length ? (
          filtered.map((item, idx) => {
            const categoryKey = getCategoryKey(item, lang);
            const title = getCategoryDisplayName(item, lang);
            const key = `${categoryKey}-${item._id?.$oid || idx}`;

            return (
              <div 
                key={key} 
                className="catalog-card"
                onClick={() => handleCategoryClick(categoryKey)}
              >
                <div className="card-image-box">
                  <img src={item.image} alt={title} className="card-image" />
                  <div className="card-overlay">
                    <span className="card-title">{title}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="catalog-empty">
            {q ? "Нічого не знайдено" : (pickText(catalogTexts.noProducts, lang) || "Категорії відсутні")}
          </div>
        )}
      </div>
    </div>
  );
}