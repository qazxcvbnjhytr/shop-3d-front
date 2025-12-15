import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "../../hooks/useTranslation";
import { fetchCategoriesAPI } from "../../api/categoryService";
import { FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import "./DynamicCatalogDropdown.css";
// ✅ ПРАВИЛЬНЕ ОТРИМАННЯ НАЗВИ КАТЕГОРІЇ (DB-DRIVEN)
const getCategoryDisplayName = (category, language) => {
  return (
    category?.names?.[language] ||
    category?.names?.en ||
    category?.category ||
    "Невідома категорія"
  );
};

export default function DynamicCatalogDropdown({
  catalogLabel,
  moveNavBg,
  navBgRef,
  setMenuActive
}) {
  const { t, language, loading: langLoading } = useTranslation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const catalogTexts = t?.catalogPage;
  const fetchErrorText =
    catalogTexts?.fetchError || "Помилка завантаження категорій";

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchCategoriesAPI(language);

        if (!Array.isArray(data)) {
          throw new Error("Invalid categories format");
        }

        if (isMounted) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
        if (isMounted) {
          setError(fetchErrorText);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (!langLoading) {
      loadCategories();
    }

    return () => {
      isMounted = false;
    };
  }, [language, langLoading, fetchErrorText]);

  const handleMouseEnter = (e) => {
    const link = e.currentTarget.querySelector(".catalog-link");
    moveNavBg(link);
  };

  const handleMouseLeave = () => {
    navBgRef.current && (navBgRef.current.style.width = "0");
  };

  const handleLinkClick = (e, categoryKey) => {
    e.stopPropagation();
    setMenuActive(false);
    navigate(`/catalog/${categoryKey}`);
  };

  return (
    <li
      className="nav-item catalog-dropdown"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link to="/catalog" className="catalog-link">
        <span>{catalogLabel}</span>
      </Link>

      <ul className="dropdown-menu">
        {isLoading ? (
          <li className="dropdown-status loading-item">
            <FaSpinner className="spinner" />
            {catalogTexts?.loading || "Завантаження..."}
          </li>
        ) : error ? (
          <li className="dropdown-status error-item">
            <FaExclamationTriangle />
            {error}
          </li>
        ) : categories.length > 0 ? (
          categories.map((cat) => (
            <li
              key={cat._id || cat.category}
              className="dropdown-item"
            >
              <Link
                to={`/catalog/${cat.category}`}
                onClick={(e) =>
                  handleLinkClick(e, cat.category)
                }
              >
                {getCategoryDisplayName(cat, language)}
              </Link>
            </li>
          ))
        ) : (
          <li className="dropdown-status no-data">
            {catalogTexts?.noProducts ||
              "Немає доступних категорій"}
          </li>
        )}
      </ul>
    </li>
  );
}
