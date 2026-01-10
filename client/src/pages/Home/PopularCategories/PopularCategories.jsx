import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "../../../context/LanguageContext";
import "./PopularCategories.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Хелпер, щоб картинка коректно відображалась (локальна або зовнішня)
const getCategoryImg = (src) => {
  if (!src) return ""; // Можна додати шлях до заглушки '/img/no-cat.png'
  if (src.startsWith("http")) return src;
  return `${API_URL}${src.startsWith("/") ? "" : "/"}${src}`;
};

export default function PopularCategories({ items = [] }) {
  const { translations, language } = useContext(LanguageContext);
  
  const tHome = translations?.home || {};
  const lang = language === "uk" ? "ua" : (language || "ua");

  if (!items.length) return null;

  return (
    <section className="pc">
      <div className="pc__head">
        <h2 className="pc__h2">
          {tHome.popularTitle || "Popular Categories"}
        </h2>
        <Link className="pc__link" to="/catalog">
          {tHome.gotoCatalog || "All Categories"} →
        </Link>
      </div>

      <div className="pc__grid">
        {items.map((cat) => {
          // 1. Назва динамічно: ua або en
          const label = cat.names?.[lang] || cat.names?.["ua"] || cat.category;
          
          // 2. Картинка на фон
          const bgImage = getCategoryImg(cat.image);

          return (
            <Link 
              key={cat._id?.$oid || cat.category} 
              to={`/catalog/${cat.category}`} 
              className="pc__tile"
              style={{ backgroundImage: `url(${bgImage})` }} // <--- ФОТО ТУТ
            >
              <div className="pc__overlay"></div> {/* Затемнення, щоб текст читався */}
              
              <div className="pc__content">
                <div className="pc__title">{label}</div>
                <div className="pc__hint">
                    {tHome.viewCategory || "View"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}