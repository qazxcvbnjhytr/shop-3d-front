import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "../../hooks/useTranslation";
import axios from "axios";
import "./Catalog.css";

// ✅ ПРАВИЛЬНА НАЗВА КАТЕГОРІЇ З MONGODB
const getCategoryDisplayName = (category, language) => {
  return (
    category?.names?.[language] ||
    category?.names?.en ||
    category?.category ||
    ""
  );
};

export default function Catalog() {
  const { t, loading, language } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const catalogTexts = t?.catalogPage;

  // ✅ пошук тепер з URL, щоб керувати з Header
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/categories", {
          withCredentials: true,
        });

        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load categories:", err);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!q) return categories;

    return categories.filter((item) =>
      getCategoryDisplayName(item, language)
        .toLowerCase()
        .includes(q)
    );
  }, [categories, q, language]);

  if (loading || !catalogTexts) {
    return null; // або Loader
  }

  const handleCategoryClick = (categoryKey) => {
    navigate(`/catalog/${categoryKey}`);
  };

  return (
    <div className="catalog-page">
      <h2 className="catalog-title">{catalogTexts.catalog}</h2>

      <div className="catalog-grid">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((item) => (
            <div key={item._id} className="catalog-item">
              <div
                className="catalog-image-wrapper"
                onClick={() => handleCategoryClick(item.category)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCategoryClick(item.category);
                }}
              >
                <img
                  src={item.image}
                  alt={getCategoryDisplayName(item, language)}
                  className="catalog-image"
                />

                <div className="category-name">
                  {getCategoryDisplayName(item, language)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>
            {q
              ? language === "ua"
                ? "Нічого не знайдено за запитом."
                : "Nothing found for your query."
              : catalogTexts.noProducts}
          </p>
        )}
      </div>
    </div>
  );
}
