import React from "react";
import { Link } from "react-router-dom";
import "./HomeProductCard.css";

function formatPrice(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("uk-UA");
}

export default function HomeProductCard({ p, lang, getImg, pickText }) {
  const id = p?._id || p?.id;

  const title =
    (lang === "ua" ? p?.name_ua : p?.name_en) ||
    pickText(p?.name, lang) ||
    pickText(p?.title, lang) ||
    "Товар";

  const categoryKey = pickText(p?.category, lang) || p?.categoryKey || p?.categorySlug || "";
  const productUrl = id && categoryKey ? `/catalog/${categoryKey}/${id}` : "/catalog";

  const price = p?.price;
  const discount = Number(p?.discount || 0);
  const finalPrice =
    Number.isFinite(Number(price)) && discount > 0
      ? Math.round(Number(price) * (1 - discount / 100))
      : price;

  const img = getImg?.(p);

  return (
    <div className="hp">
      <Link className="hp__media" to={productUrl}>
        {discount > 0 ? <div className="hp__badge">-{discount}%</div> : null}
        {img ? (
          <img className="hp__img" src={img} alt={title} loading="lazy" />
        ) : (
          <div className="hp__img hp__img--stub">Фото</div>
        )}
      </Link>

      <div className="hp__body">
        <div className="hp__title" title={title}>{title}</div>

        <div className="hp__price">
          {finalPrice ? (
            <>
              <span className="hp__main">{formatPrice(finalPrice)} ₴</span>
              {discount > 0 && price ? (
                <span className="hp__old">{formatPrice(price)} ₴</span>
              ) : null}
            </>
          ) : (
            <span className="hp__main">Ціна за запитом</span>
          )}
        </div>

        <div className="hp__actions">
          <Link className="hp__btn hp__btn--ghost" to={productUrl}>Переглянути</Link>
          <Link className="hp__btn" to={productUrl}>3D</Link>
        </div>
      </div>
    </div>
  );
}
