import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "../../../context/LanguageContext"; // Перевір шлях до контексту
import "./HomeHero.css";

export default function HomeHero() {
  const { translations } = useContext(LanguageContext);
  const t = translations?.homeHero || {};

  return (
    <section className="hero">
      <div className="hero__left">
        <div className="hero__pill">{t.newCollection || "New Collection 2025"}</div>
        <h1 className="hero__h1">{t.title || "Find your perfect furniture"}</h1>
        <p className="hero__sub">
          {t.subtitle || "Browse products, add to favorites, and test in 3D."}
        </p>

        <div className="hero__benefits">
          <div className="hero__benefit">{t.benefit1 || "3D View"}</div>
          <div className="hero__benefit">{t.benefit2 || "Delivery"}</div>
          <div className="hero__benefit">{t.benefit3 || "Support 24/7"}</div>
          <div className="hero__benefit">{t.benefit4 || "Warranty"}</div>
        </div>

        <div className="hero__cta">
          <Link className="hero__btn hero__btn--primary" to="/catalog">
            {t.ctaCatalog || "To Catalog"}
          </Link>
          <Link className="hero__btn hero__btn--ghost" to="/catalog">
            {t.cta3d || "View in 3D"}
          </Link>
          <Link className="hero__btn hero__btn--ghost" to="/news">
            {t.ctaPromo || "Promotions"}
          </Link>
        </div>
      </div>

      <div className="hero__right">
        <div className="hero__media">
          <div className="hero__chip">{t.hitPrice || "Hot Price"}</div>
          <img className="hero__img" src="/Home/meblihub_svoi.png" alt="MebliHub" />
        </div>
      </div>
    </section>
  );
}