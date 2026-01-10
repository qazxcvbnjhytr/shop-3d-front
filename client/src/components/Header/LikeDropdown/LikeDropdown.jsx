import React, { useMemo, useRef, useCallback, useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./LikeDropdown.css";

import { LanguageContext } from "@context/LanguageContext";
// ✅ ВАЖЛИВО: імпорт тільки з одного місця (де Provider)
import { useLikes } from "../../../context/LikesContext.jsx";

const RAW_API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const MAX_VISIBLE = 8;

// ✅ якщо сторінка лайків у тебе інша — поміняй тут
const FAVS_ROUTE = "/favorites";

const normalizeBase = (raw) => {
  const s = String(raw || "").replace(/\/+$/, "");
  return s.replace(/\/api\/?$/, "");
};
const BASE = normalizeBase(RAW_API);

const getApiOrigin = (apiUrl) => {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return normalizeBase(apiUrl);
  }
};
const API_ORIGIN = getApiOrigin(RAW_API);

const normLang = (language) => String(language || "ua").toLowerCase();

const pickText = (value, language = "ua") => {
  const lang = normLang(language);
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") return value?.[lang] || value?.ua || value?.uk || value?.en || "";
  return "";
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatUAH = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `${Math.round(v).toLocaleString("uk-UA")} грн`;
};

const joinUrl = (origin, raw) => {
  if (!raw || typeof raw !== "string") return "/placeholder.png";
  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;
  const o = String(origin || "").replace(/\/+$/, "");
  const p = raw.startsWith("/") ? raw : `/${raw}`;
  return `${o}${p}`;
};

const calcFinalPrice = (price, discountPercent) => {
  const p = toNumber(price);
  const d = Math.min(100, Math.max(0, toNumber(discountPercent)));
  return Math.round((p * (100 - d)) / 100);
};

const getProductIdFromLike = (like) => {
  if (!like) return "";
  if (typeof like === "string" || typeof like === "number") return String(like);
  if (typeof like === "object") return String(like.productId || like.product?._id || "");
  return "";
};

export default function LikeDropdown({ open, onClose, closeDelay = 180 }) {
  const { language } = useContext(LanguageContext);

  // ✅ тепер useLikes точно не null, бо імпорт з правильного файла
  const likesCtx = useLikes();
  const likedProducts = likesCtx?.likedProducts || [];
  const likedProductIds = likesCtx?.likedProductIds || [];

  const [productsById, setProductsById] = useState({});
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

  const ids = useMemo(() => {
    const list = Array.isArray(likedProductIds) ? likedProductIds.map(String).filter(Boolean) : [];
    return Array.from(new Set(list));
  }, [likedProductIds]);

  // ✅ чистимо кеш для видалених лайків
  useEffect(() => {
    setProductsById((prev) => {
      const next = {};
      for (const id of ids) {
        if (prev[id] !== undefined) next[id] = prev[id];
      }
      return next;
    });
  }, [ids]);

  // ✅ підвантажуємо деталі продуктів (для name/price/discount/route)
  useEffect(() => {
    if (!open) return;
    if (!ids.length) return;

    const missing = ids.filter((id) => productsById[id] === undefined);
    if (!missing.length) return;

    let alive = true;

    (async () => {
      const res = await Promise.allSettled(missing.map((id) => axios.get(`${BASE}/api/products/${id}`)));

      if (!alive) return;

      setProductsById((prev) => {
        const next = { ...prev };
        res.forEach((r, idx) => {
          const id = missing[idx];
          if (r.status === "fulfilled" && r.value?.data) next[id] = r.value.data;
          else next[id] = null;
        });
        return next;
      });
    })();

    return () => {
      alive = false;
    };
  }, [open, ids, productsById]);

  const items = useMemo(() => {
    const arr = Array.isArray(likedProducts) ? likedProducts : [];

    return arr
      .map((like, idx) => {
        const productId = getProductIdFromLike(like);
        if (!productId) return null;

        const p = productsById[productId]; // object|null|undefined

        const name =
          pickText(like?.productName, language) ||
          pickText(p?.name, language) ||
          "Товар";

        const imgRaw = like?.productImage || p?.images?.[0] || p?.image || "";
        const img = joinUrl(API_ORIGIN, imgRaw);

        const price = toNumber(p?.price ?? like?.price);
        const discount = toNumber(p?.discount ?? like?.discount);
        const hasDiscount = price > 0 && discount > 0;
        const finalPrice = hasDiscount ? calcFinalPrice(price, discount) : price;

        const category = p?.category || like?.productCategory || "all";
        const subCategory = p?.subCategory || "product";

        const to =
          p && p !== null
            ? `/catalog/${category}/${subCategory}/${String(p._id || productId)}`
            : `/catalog/${category}`;

        return {
          id: productId || `like-${idx}`,
          to,
          img,
          name,
          price,
          discount,
          hasDiscount,
          finalPrice,
          missingProduct: p === null,
        };
      })
      .filter(Boolean);
  }, [likedProducts, productsById, language]);

  const ua = normLang(language) === "ua" || normLang(language) === "uk";
  const title = ua ? "Обрані" : "Wishlist";
  const viewAll = ua ? "Переглянути всі" : "View all";
  const empty = ua ? "Поки що немає лайкнутих товарів." : "No liked products yet.";
  const removed = ua ? "Товар недоступний" : "Product unavailable";

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
        <div className="like-dd__title">
          {title}
          <span className="like-dd__count">{ids.length}</span>
        </div>

        {/* ✅ клік на сторінку лайків */}
        <Link className="like-dd__all" to={FAVS_ROUTE} onClick={() => onClose?.()}>
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
                      {it.missingProduct ? removed : it.name}
                    </div>

                    <div className="like-dd__price">
                      {it.price > 0 ? (
                        <>
                          {it.hasDiscount && (
                            <span className="like-dd__old">{formatUAH(it.price)}</span>
                          )}
                          <span className="like-dd__now">{formatUAH(it.finalPrice)}</span>
                        </>
                      ) : (
                        <span className="like-dd__now">—</span>
                      )}
                    </div>
                  </div>

                  {it.hasDiscount && (
                    <span className="like-dd__badge">-{Math.round(it.discount)}%</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="like-dd__empty">{empty}</div>
        )}
      </div>

      {/* ✅ низ: кнопка перейти на всі лайки (клікати легко) */}
      <div className="like-dd__footer">
        <Link className="like-dd__button" to={FAVS_ROUTE} onClick={() => onClose?.()}>
          {viewAll}
        </Link>
      </div>
    </div>
  );
}
