import React, { useMemo, useRef, useCallback, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "@context/LanguageContext";
import { useLikes } from "../../../context/LikesContext.jsx";

import "./LikeDropdown.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const MAX_VISIBLE = 8;

const normLang = (language) => String(language || "ua").toLowerCase();

const pickText = (value, language = "ua") => {
  const lang = normLang(language);

  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    return (
      value?.[lang] ||
      value?.ua ||
      value?.uk ||
      value?.en ||
      ""
    );
  }
  return "";
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const buildImg = (raw) => {
  if (!raw || typeof raw !== "string") return "/placeholder.png";
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("/")) return `${API_URL}${raw}`;
  return `${API_URL}/${raw}`.replace(/\/{2,}/g, "/").replace(":/", "://");
};

export default function LikeDropdown({ open, onClose, closeDelay = 180 }) {
  const { language } = useContext(LanguageContext);
  const { likedProducts = [] } = useLikes();

  const closeTimerRef = useRef(null);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => onClose?.(), closeDelay);
  }, [cancelClose, onClose, closeDelay]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  const items = useMemo(() => {
    const arr = Array.isArray(likedProducts) ? likedProducts : [];

    return arr.map((p, idx) => {
      // якщо колись будеш робити populate:
      const productObj = p?.product && typeof p.product === "object" ? p.product : null;

      const id = String(
        p?.productId ||
          productObj?._id ||
          p?._id ||
          p?.id ||
          `like-${idx}`
      );

      const category =
        p?.productCategory ||
        p?.category ||
        productObj?.category ||
        "unknown";

      const to = `/catalog/${category}/${id}`;

      const imgRaw =
        p?.productImage ||
        p?.image ||
        p?.imageUrl ||
        productObj?.image ||
        (Array.isArray(productObj?.images) ? productObj.images[0] : null) ||
        (Array.isArray(p?.images) ? p.images[0] : null);

      // ✅ спочатку беремо те, що ти реально зберігаєш у лайках: productName
      const name =
        pickText(p?.productName, language) ||
        pickText(productObj?.name, language) ||
        pickText(p?.name, language) ||
        p?.name_ua ||
        p?.name_en ||
        "Товар";

      const price = toNumber(productObj?.price ?? p?.price ?? 0);
      const discount = toNumber(productObj?.discount ?? p?.discount ?? 0);
      const hasDiscount = discount > 0;

      const finalPrice = hasDiscount
        ? Math.round(price - (price * discount) / 100)
        : price;

      return {
        id,
        to,
        img: buildImg(imgRaw),
        name,
        price,
        discount,
        hasDiscount,
        finalPrice,
      };
    });
  }, [likedProducts, language]);

  const title = normLang(language) === "ua" || normLang(language) === "uk" ? "Обрані" : "Wishlist";
  const viewAll = normLang(language) === "ua" || normLang(language) === "uk" ? "Переглянути всі" : "View all";
  const empty =
    normLang(language) === "ua" || normLang(language) === "uk"
      ? "Поки що немає лайкнутих товарів."
      : "No liked products yet.";

  return (
    <div
      className={`like-dd ${open ? "open" : ""}`}
      role="menu"
      aria-label={title}
      aria-hidden={!open}
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
      onKeyDown={(e) => e.key === "Escape" && onClose?.()}
      tabIndex={-1}
    >
      <div className="like-dd__header">
        <div className="like-dd__title">{title}</div>

        <Link className="like-dd__all" to="/account" onClick={() => onClose?.()}>
          {viewAll}
        </Link>
      </div>

      <div className="like-dd__body">
        {items.length ? (
          <ul className="like-dd__list">
            {items.slice(0, MAX_VISIBLE).map((it) => (
              <li key={it.id} className="like-dd__item">
                <Link className="like-dd__link" to={it.to} onClick={() => onClose?.()}>
                  <img
                    className="like-dd__img"
                    src={it.img}
                    alt={it.name}
                    loading="lazy"
                    onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                  />

                  <div className="like-dd__meta">
                    <div className="like-dd__name" title={it.name}>
                      {it.name}
                    </div>

                    {/* ✅ показуємо ціни тільки якщо вони реально є */}
                    {it.price > 0 && (
                      <div className="like-dd__price">
                        {it.hasDiscount && <span className="like-dd__old">{it.price} грн</span>}
                        <span className="like-dd__now">{it.finalPrice} грн</span>
                      </div>
                    )}
                  </div>

                  {it.hasDiscount && <span className="like-dd__badge">-{it.discount}%</span>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="like-dd__empty">{empty}</div>
        )}
      </div>

      {items.length > MAX_VISIBLE && (
        <div className="like-dd__footer">
          {normLang(language) === "ua" || normLang(language) === "uk"
            ? "Прокрути список, щоб побачити більше."
            : "Scroll to see more."}
        </div>
      )}
    </div>
  );
}
