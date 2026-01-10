  import React, { useContext, useEffect, useRef, useState } from "react";
  import { Link, useLocation } from "react-router-dom";

  // ✅ Правильні шляхи (згідно з вашим проектом)
  import { LanguageContext } from "../../../context/LanguageContext";
  import DynamicCatalogDropdown from "../../DCD/DynamicCatalogDropdown"; 

  import { FaBars, FaTimes } from "react-icons/fa";
  import "./HeaderNav.css";

  export default function HeaderNav({ menuActive, setMenuActive }) {
    const location = useLocation();
    
    const { translations, loading } = useContext(LanguageContext);
    const t = translations?.header || {};

    const [scrolled, setScrolled] = useState(false);
    const navBgRef = useRef(null);

    const isHomePage = location.pathname === "/";
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


    const getShortLabel = (text) => {
        if (!text) return "";
        if (text.includes("&")) return text.split("&")[0].trim(); 
        return text;
    };

    const navLinks = [
      { path: "/where-to-buy", label: t.whereToBuy || "Where to Buy" },
      
     { path: "/sales", label: t.sales || "Sales" },

      
      { path: "/contacts", label: t.contacts || "Contacts" },
      
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