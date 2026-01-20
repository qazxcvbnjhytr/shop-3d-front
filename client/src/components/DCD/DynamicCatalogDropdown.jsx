import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaSpinner, FaExclamationTriangle, FaBars, FaChevronRight } from "react-icons/fa";

import { useTranslation } from "../../hooks/useTranslation"; 
import { fetchCategoriesAPI } from "../../api/categoryService"; 

import "./DynamicCatalogDropdown.css";

// Helper: отримання назви
const getDisplayName = (item, language) => {
  if (!item) return "Item";
  if (item.names && typeof item.names === 'object') {
    return item.names[language] || item.names.en || item.names.ua || item.key || "Unnamed";
  }
  return item.name || item.category || item.key || "Unnamed";
};

// Helper: скорочення назви (&)
const getShortLabel = (text) => {
  if (!text) return "";
  if (text.includes("&")) return text.split("&")[0].trim();
  return text;
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

  // Завантаження даних
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
        if (isMounted) setError(t.error || "Error");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (!langLoading) loadCategories();
    return () => { isMounted = false; };
  }, [language, langLoading, t.error]); 

  // Логіка відкриття на головній
  useEffect(() => {
    if (isHomePage) {
      setIsOpen(true); 
    } else {
      setIsOpen(false);
    }
  }, [isHomePage]);

  // Закриття при кліку зовні
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (!isHomePage) setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isHomePage]);

  // Клік по категорії
  const handleCategoryClick = useCallback((categoryKey, subKey = null) => {
    if (setMenuActive) setMenuActive(false);
    if (!isHomePage) setIsOpen(false);
    
    const url = subKey 
      ? `/catalog/${categoryKey}/${subKey}` 
      : `/catalog/${categoryKey}`;
      
    navigate(url);
  }, [isHomePage, navigate, setMenuActive]);

  const toggleDropdown = () => {
    if (!isHomePage) setIsOpen(prev => !prev);
  };

  const shouldShowList = isOpen; 

  return (
    <div 
      className={`catalog-wrapper ${isHomePage ? "mode-home" : "mode-overlay"} ${isOpen ? "is-open" : ""}`} 
      ref={dropdownRef}
    >
      {/* HEADER BUTTON (TRIGGER) */}
      <div className="catalog-trigger" onClick={toggleDropdown}>
        <div className="trigger-content">
          <FaBars className="trigger-icon" />
          <span className="trigger-title">
             {t.title || (language === 'en' ? "PRODUCT CATALOG" : "КАТАЛОГ ТОВАРІВ")}
          </span>
        </div>
        {/* Стрілка для індикації */}
        {!isHomePage && (
           <FaChevronRight className={`trigger-arrow ${isOpen ? "rotated" : ""}`} />
        )}
      </div>

      {/* DROPDOWN LIST */}
      {shouldShowList && (
        <ul className="catalog-list">
          {isLoading ? (
            <li className="catalog-status">
                <FaSpinner className="spinner" /> 
                <span>{t.loading || "Loading..."}</span>
            </li>
          ) : error ? (
            <li className="catalog-status error">
                <FaExclamationTriangle /> 
                <span>{error}</span>
            </li>
          ) : categories.length > 0 ? (
            categories.map((cat) => {
               const key = cat._id || cat.category; 
               const hasChildren = cat.children && cat.children.length > 0;
               const shortName = getShortLabel(getDisplayName(cat, language));
               
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
                    onClick={(e) => !hasChildren && handleCategoryClick(cat.category)}
                  >
                    <span className="cat-text">{shortName}</span>
                    {hasChildren && <FaChevronRight className="cat-arrow" />}
                  </Link>

                  {/* SUBMENU POPUP */}
                  {hasChildren && hoveredCategory === cat.category && (
                    <div className="submenu-wrap">
                      <ul className="submenu-list">
                        {cat.children.map((child, idx) => {
                          const childShortName = getShortLabel(getDisplayName(child, language));

                          return (
                            <li key={child.key || idx} className="submenu-item">
                              <Link 
                                to={`/catalog/${cat.category}/${child.key}`}
                                className="submenu-link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCategoryClick(cat.category, child.key);
                                }}
                              >
                                {childShortName}
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
            <li className="catalog-status">
               {t.empty || "No items"}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}