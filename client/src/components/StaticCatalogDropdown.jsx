// client/src/components/DynamicCatalogDropdown.jsx (оновлена логіка)

import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import { fetchCategoriesAPI } from "../api/categoryService"; // 🔥 Використовуємо API-сервіс
import { FaSpinner, FaExclamationTriangle } from "react-icons/fa"; // Для статусів

// --- ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ ЛОКАЛІЗАЦІЇ ---
// : Обробляє 'ua' та 'ua' як українську мову
const getCategoryDisplayName = (categoryItem, language) => {
  return (
    categoryItem?.names?.[language] ||
    categoryItem?.names?.en ||
    categoryItem?.category ||
    ""
  );
};

// ------------------------------------------

// Компонент, який тепер сам завантажує категорії (ігноруючи Header)
export default function DynamicCatalogDropdown({ 
    catalogLabel, // Лейбл каталогу з Header (для статичного тексту)
    moveNavBg, 
    navBgRef, 
    setMenuActive 
}) {
    const { language, translations } = useContext(LanguageContext); 
    const navigate = useNavigate();

    // 🔥 СТАНИ ДЛЯ API-ЗАВАНТАЖЕННЯ: ЗНОВУ В КОМПОНЕНТІ
    const [categories, setCategories] = useState([]); 
    const [isLoading, setIsLoading] = useState(true); 
    const [error, setError] = useState(null); 

    // 🔥 ЕФЕКТ: ЗАВАНТАЖЕННЯ КАТЕГОРІЙ З БАЗИ ДАНИХ
    useEffect(() => {
        let isMounted = true;
        
        const loadCategories = async () => {
            setIsLoading(true); 
            setError(null);

            try {
                // Виклик API для отримання динамічних даних
                const fetchedCategories = await fetchCategoriesAPI(language); 
                
                if (isMounted) {
                    setCategories(fetchedCategories);
                }
            } catch (err) {
                console.error("Помилка завантаження категорій:", err);
                const errorMessage = translations[language]?.catalogPage?.fetchError || "Помилка завантаження каталогу";
                if (isMounted) {
                    setError(errorMessage);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadCategories();
        
        return () => {
            isMounted = false;
        };
    }, [language, translations]); // Перезавантажуємо при зміні мови

    // Хендлери для UI
    const handleMouseEnter = (e) => {
        const linkElement = e.currentTarget.querySelector('.catalog-link');
        moveNavBg(linkElement);
    };

    const handleMouseLeave = () => {
        navBgRef.current && (navBgRef.current.style.width = '0');
    };

    const handleLinkClick = (e, categoryKey) => {
        e.stopPropagation(); // Зупиняємо, щоб не закрити навігацію (якщо вона не має закриватися тут)
        setMenuActive(false); // Закриваємо мобільне меню
        navigate(`/catalog/${categoryKey}`); 
    };

    return (
        <li 
            className="nav-item catalog-dropdown" 
            onMouseEnter={handleMouseEnter} 
            onMouseLeave={handleMouseLeave}
        >
            {/* Основне посилання на сторінку каталогу */}
            <Link to="/catalog" className="catalog-link">
                <span>{catalogLabel}</span>
            </Link>
            
            <ul className="dropdown-menu">
                {isLoading ? (
                    <li className="dropdown-status loading-item">
                        <FaSpinner className="spinner" /> Завантаження...
                    </li>
                ) : error ? (
                    <li className="dropdown-status error-item" title={error}>
                        <FaExclamationTriangle className="error-icon" /> {error}
                    </li>
                ) : categories.length > 0 ? (
                    // Відображення динамічних категорій
                    categories.map(cat => (
                        <li key={cat._id || cat.category} className="dropdown-item">
                            <Link 
                                to={`/catalog/${cat.category}`} 
                                onClick={(e) => handleLinkClick(e, cat.category)}
                            >
                                {/* Локалізація назви категорії */}
                                {getCategoryDisplayName(cat, language)}
                            </Link>
                        </li>
                    ))
                ) : (
                    <li className="dropdown-status no-data">
                        {translations[language]?.catalogPage?.noProducts || "Немає доступних категорій."}
                    </li>
                )}
            </ul>
        </li>
    );
}