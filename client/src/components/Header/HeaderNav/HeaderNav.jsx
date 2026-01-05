import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

// ✅ Правильні шляхи (згідно з вашим проектом)
import { LanguageContext } from "../../../context/LanguageContext";
import DynamicCatalogDropdown from "../../DCD/DynamicCatalogDropdown"; 

import { FaBars, FaTimes } from "react-icons/fa";
import "./HeaderNav.css";

export default function HeaderNav({ menuActive, setMenuActive }) {
  const location = useLocation();
  
  // Отримуємо переклади
  const { translations, loading } = useContext(LanguageContext);
  // Беремо секцію 'header' з JSON. Якщо ще не завантажилось — порожній об'єкт.
  const t = translations?.header || {};

  const [scrolled, setScrolled] = useState(false);
  const navBgRef = useRef(null);

  // Перевірки сторінок
  const isHomePage = location.pathname === "/";
  // Мобільна версія (можна змінити на 1200, якщо меню все ще не влазить)
  const isMobile = window.innerWidth <= 1024;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuActive(false);
  }, [location.pathname, setMenuActive]);

  const moveNavBg = (target) => {
    if (isMobile || !navBgRef.current || !target) return;
    const parent = target.closest(".nav-list");
    if (!parent) return;

    const rect = target.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    navBgRef.current.style.width = rect.width + "px";
    navBgRef.current.style.left = rect.left - parentRect.left + "px";
  };

  const handleMouseLeaveNav = () => {
     if (navBgRef.current) navBgRef.current.style.width = "0";
  };

  if (loading) return null;

  // 🔥 ХАК ДЛЯ ЕКОНОМІЇ МІСЦЯ:
  // Якщо назва містить "&" (наприклад "News & Promotions"), беремо тільки першу частину.
  // Це дозволить меню влізти на ноутбуках без змін CSS.
  const getShortLabel = (text) => {
      if (!text) return "";
      if (text.includes("&")) return text.split("&")[0].trim(); 
      return text;
  };

  // Масив посилань з використанням ключів з вашого JSON
  const navLinks = [
    { path: "/where-to-buy", label: t.whereToBuy || "Where to Buy" },
    
    // Скорочуємо "News & Promotions" -> "News"
    { path: "/news", label: getShortLabel(t.news) || "News" }, 
    
    { path: "/contacts", label: t.contacts || "Contacts" },
    
    // Якщо "About Company" задовге, можна теж скоротити тут вручну
    { path: "/about", label: t.about || "About Company" }, 
    
    { path: "/collections", label: t.collections || "Сollections" },
    
    // Можна замінити на "PDF Catalog" для стислості
    { path: "/download-catalog", label: t.downloadCatalog || "Download Catalog" }, 
  ];

  return (
    <div className={`header-nav ${scrolled ? "scrolled" : ""}`}>
      <nav
        className={`nav ${menuActive ? "active" : ""}`}
        onClick={() => setMenuActive(false)}
      >
        <ul
          className={`nav-list ${menuActive ? "active" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="nav-bg" ref={navBgRef} />

          {/* ЛОГІКА: Кнопка "Каталог" показується всюди, ОКРІМ головної сторінки (на десктопі) */}
          {(!isHomePage || isMobile) && (
            <li className="nav-item catalog-wrapper-in-header">
               <DynamicCatalogDropdown setMenuActive={setMenuActive} />
            </li>
          )}

          {/* Рендеринг посилань */}
          {navLinks.map((item) => (
            <li
              key={item.path}
              className="nav-item"
              onMouseEnter={(e) => moveNavBg(e.currentTarget.querySelector("a"))}
              onMouseLeave={handleMouseLeaveNav}
            >
              <Link to={item.path} onClick={() => setMenuActive(false)}>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <button className="menu-toggle" onClick={() => setMenuActive((p) => !p)}>
        {menuActive ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>
    </div>
  );
}