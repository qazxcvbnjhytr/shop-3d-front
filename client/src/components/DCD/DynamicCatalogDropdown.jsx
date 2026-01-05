import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaSpinner, FaExclamationTriangle, FaBars, FaChevronRight } from "react-icons/fa";

import { useTranslation } from "../../hooks/useTranslation"; 
import { fetchCategoriesAPI } from "../../api/categoryService"; 

import "./DynamicCatalogDropdown.css";

// Helper для отримання повної перекладеної назви
const getDisplayName = (item, language) => {
  if (!item) return "Item";
  if (item.names && typeof item.names === 'object') {
    return item.names[language] || item.names.en || item.names.ua || item.key || "Unnamed";
  }
  return item.name || item.category || item.key || "Unnamed";
};

export default function DynamicCatalogDropdown({ setMenuActive }) {
  const { language, loading: langLoading, translations } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const isHomePage = location.pathname === "/";

  const t = translations?.catalogDropdown || {};
  const tAuth = translations?.auth || {}; 

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCategoriesAPI(language);
        if (isMounted) {
          const cats = Array.isArray(data) ? data : (data?.data || []);
          setCategories(cats);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
        if (isMounted) setError(t.error || "Error loading");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (!langLoading) loadCategories();
    return () => { isMounted = false; };
  }, [language, langLoading, t.error]); 

  useEffect(() => {
    if (isHomePage) {
      setIsOpen(true); 
    } else {
      setIsOpen(false);
    }
  }, [isHomePage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (!isHomePage) setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isHomePage]);

  const handleCategoryClick = useCallback((categoryKey, subKey = null) => {
    if (setMenuActive) setMenuActive(false);
    if (!isHomePage) setIsOpen(false);
    
    const url = subKey 
      ? `/catalog/${categoryKey}/${subKey}` 
      : `/catalog/${categoryKey}`;
      
    navigate(url);
  }, [isHomePage, navigate, setMenuActive]);

  const toggleDropdown = () => setIsOpen(prev => !prev);
  const shouldShowList = isOpen; 

  // 🔥 ЛОГІКА СКОРОЧЕННЯ:
  // Якщо назва містить "&" (наприклад "Sofas & Armchairs"), беремо тільки "Sofas".
  // Можна додати й інші розділювачі, якщо потрібно (наприклад "/").
  const getShortLabel = (text) => {
      if (!text) return "";
      if (text.includes("&")) return text.split("&")[0].trim();
      return text;
  };

  return (
    <div 
      className={`catalog-sidebar-wrapper ${isHomePage ? "mode-home" : "mode-overlay"}`} 
      ref={dropdownRef}
    >
      <div className="catalog-header" onClick={toggleDropdown}>
        <div className="header-content">
          <FaBars className="burger-icon" />
          <span className="header-title">
             {t.title || (language === 'en' ? "PRODUCT CATALOG" : "КАТАЛОГ ТОВАРІВ")}
          </span>
        </div>
      </div>

      {shouldShowList && (
        <ul className="catalog-list">
          {isLoading ? (
            <li className="status-item"><FaSpinner className="spinner" /> 
               {t.loading || tAuth.loading || (language === 'en' ? "Loading..." : "Завантаження...")}
            </li>
          ) : error ? (
            <li className="status-item error"><FaExclamationTriangle /> {error}</li>
          ) : categories.length > 0 ? (
            categories.map((cat) => {
               const key = cat._id || cat.category; 
               const hasChildren = cat.children && cat.children.length > 0;
               
               // 1. Отримуємо повну назву
               const fullName = getDisplayName(cat, language);
               // 2. Скорочуємо її для меню
               const shortName = getShortLabel(fullName);
               
               return (
                <li 
                  key={key} 
                  className="catalog-item"
                  onMouseEnter={() => setHoveredCategory(cat.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Link
                    to={`/catalog/${cat.category}`}
                    className="catalog-link"
                  >
                    {/* Виводимо скорочену назву */}
                    <span className="cat-name">{shortName}</span>
                    {hasChildren && <FaChevronRight className="arrow-icon" />}
                  </Link>

                  {hasChildren && hoveredCategory === cat.category && (
                    <div className="subcategory-popup">
                      <ul className="subcategory-list">
                        {cat.children.map((child, idx) => {
                          // Те саме для підкатегорій
                          const childFullName = getDisplayName(child, language);
                          const childShortName = getShortLabel(childFullName);

                          return (
                            <li key={child.key || idx} className="subcategory-item">
                              <Link 
                                to={`/catalog/${cat.category}/${child.key}`}
                                className="subcategory-link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCategoryClick(cat.category, child.key);
                                }}
                              >
                                <span className="sub-name">{childShortName}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })
          ) : (
            <li className="status-item">
               {t.empty || (language === 'en' ? "No categories found" : "Категорії відсутні")}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}