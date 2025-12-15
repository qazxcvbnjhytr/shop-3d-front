import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LanguageContext } from "@context/LanguageContext";

import DynamicCatalogDropdown from "@components/DCD/DynamicCatalogDropdown";
import { FaBars, FaTimes } from "react-icons/fa";

import "./HeaderNav.css";

export default function HeaderNav({ menuActive, setMenuActive }) {
  const location = useLocation();
  const { translations, loading } = useContext(LanguageContext);
  const texts = translations?.header || {};

  const [scrolled, setScrolled] = useState(false);
  const navBgRef = useRef(null);


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
    const rect = target.getBoundingClientRect();
    const parentRect = target.closest(".nav-list").getBoundingClientRect();
    navBgRef.current.style.width = rect.width + "px";
    navBgRef.current.style.left = rect.left - parentRect.left + "px";
  };

  if (loading) return null;

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

          <DynamicCatalogDropdown
            catalogLabel={texts.catalog}
            moveNavBg={moveNavBg}
            navBgRef={navBgRef}
            setMenuActive={setMenuActive}
          />

          {[
            { path: "/where-to-buy", label: texts.whereToBuy },
            { path: "/news", label: texts.news },
            { path: "/contacts", label: texts.contacts },
            { path: "/about", label: texts.about },
            { path: "/request-price", label: texts.requestPrice },
            { path: "/download-catalog", label: texts.downloadCatalog },
          ].map((item) => (
            <li
              key={item.path}
              className="nav-item"
              onMouseEnter={(e) => moveNavBg(e.currentTarget.querySelector("a"))}
              onMouseLeave={() => navBgRef.current && (navBgRef.current.style.width = "0")}
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
