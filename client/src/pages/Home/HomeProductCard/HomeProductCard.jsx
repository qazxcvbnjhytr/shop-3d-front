import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "../../../context/LanguageContext";
import "./HomeProductCard.css";

// Хелпер для форматування (10 000 замість 10000)
const formatPrice = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("uk-UA") : "";
};

export default function HomeProductCard({ p, getImg, pickText }) {
  const { translations, language } = useContext(LanguageContext);
  
  // Безпечний доступ до текстів
  const t = translations?.productCard || {};
  const lang = language || "ua";

  // 1. Логіка Назви (пріоритет: pickText -> ua/en -> name -> дефолт)
  const title = 
    pickText?.(p?.name, lang) || 
    (lang === "ua" ? p?.name_ua : p?.name_en) || 
    p?.name || 
    t.defaultTitle || "Product";

  // 2. Логіка Посилання (додаємо слаг категорії для красивого URL)
  const id = p?._id || p?.id;
  const catSlug = p?.categorySlug || pickText?.(p?.category, "en") || ""; 
  const productUrl = id ? `/catalog/${catSlug ? catSlug + "/" : ""}${id}` : "#";

  // 3. Логіка Ціни
  const price = Number(p?.price || 0);
  const discount = Number(p?.discount || 0);
  const hasDiscount = discount > 0 && price > 0;
  
  // Якщо є знижка — рахуємо нову ціну, інакше — стара
  const finalPrice = hasDiscount ? Math.round(price * (1 - discount / 100)) : price;

  // 4. Картинка
  const img = getImg?.(p);

  return (
    <div className="hp">
      <Link className="hp__media" to={productUrl}>
        {hasDiscount && <div className="hp__badge">-{discount}%</div>}
        
        {img ? (
          <img className="hp__img" src={img} alt={title} loading="lazy" />
        ) : (
          <div className="hp__img hp__img--stub">{t.noPhoto || "No Photo"}</div>
        )}
      </Link>

      <div className="hp__body">
        {/* h3 краще для SEO, ніж div */}
        <h3 className="hp__title" title={title}>
            {title}
        </h3>

        <div className="hp__price">
          {finalPrice > 0 ? (
            <>
              <span className="hp__main">
                {formatPrice(finalPrice)} {t.currency || "₴"}
              </span>
              {hasDiscount && (
                <span className="hp__old">{formatPrice(price)} ₴</span>
              )}
            </>
          ) : (
            <span className="hp__main hp__main--request">
              {t.priceRequest || "Ціна за запитом"}
            </span>
          )}
        </div>

        <div className="hp__actions">
          <Link className="hp__btn hp__btn--ghost" to={productUrl}>
            {t.viewBtn || "Огляд"}
          </Link>
          <Link className="hp__btn" to={productUrl}>
            {t.btn3d || "3D"}
          </Link>
        </div>
      </div>
    </div>
  );
}