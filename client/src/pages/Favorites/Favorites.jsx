import React, { useEffect, useMemo, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Favorites.css";

import { useAuth } from "../../context/AuthContext.jsx";
import { useLikes } from "../../context/LikesContext.jsx";

// Якщо у тебе є alias @context/LanguageContext — можеш використати його.
// Якщо ні — просто видали LanguageContext і pickText буде брати ua/en за замовчуванням.
let LanguageContext = null;
try {
  // eslint-disable-next-line import/no-unresolved
  ({ LanguageContext } = await import("@context/LanguageContext"));
} catch {
  // ignore
}

const RAW_API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE = String(RAW_API).replace(/\/+$/, "").replace(/\/api\/?$/, "");
const API_ORIGIN = (() => {
  try {
    return new URL(RAW_API).origin;
  } catch {
    return BASE;
  }
})();

const normLang = (language) => String(language || "ua").toLowerCase();

const pickText = (value, language = "ua") => {
  const lang = normLang(language);
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") return value?.[lang] || value?.ua || value?.uk || value?.en || "";
  return "";
};

const joinUrl = (origin, raw) => {
  if (!raw || typeof raw !== "string") return "/placeholder.png";
  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;
  const o = String(origin || "").replace(/\/+$/, "");
  const p = raw.startsWith("/") ? raw : `/${raw}`;
  return `${o}${p}`;
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

export default function Favorites() {
  const { user } = useAuth();
  const { likedProducts = [], likedProductIds = [], toggleLike, isLoading } = useLikes();

  const language = LanguageContext ? useContext(LanguageContext)?.language : "ua";
  const ua = normLang(language) === "ua" || normLang(language) === "uk";

  // Підвантажимо деталі товарів для правильних route (category/subCategory)
  const [productsById, setProductsById] = useState({});

  const ids = useMemo(() => {
    const list = Array.isArray(likedProductIds) ? likedProductIds.map(String).filter(Boolean) : [];
    return Array.from(new Set(list));
  }, [likedProductIds]);

  useEffect(() => {
    if (!user) return;
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
  }, [user, ids, productsById]);

  const items = useMemo(() => {
    const arr = Array.isArray(likedProducts) ? likedProducts : [];

    return arr
      .map((like) => {
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

        return { productId, to, img, name, price, discount, hasDiscount, finalPrice, missingProduct: p === null, rawLike: like };
      })
      .filter(Boolean);
  }, [likedProducts, productsById, language]);

  if (!user) {
    return (
      <div className="fav-page">
        <div className="fav-head">
          <h1 className="fav-title">{ua ? "Обрані товари" : "Favorites"}</h1>
          <p className="fav-sub">{ua ? "Увійдіть, щоб бачити обрані товари." : "Please sign in to see favorites."}</p>
        </div>
        <Link className="fav-btn" to="/login">{ua ? "Увійти" : "Sign in"}</Link>
      </div>
    );
  }

  return (
    <div className="fav-page">
      <div className="fav-head">
        <h1 className="fav-title">{ua ? "Обрані товари" : "Favorites"}</h1>
        <div className="fav-count">{items.length}</div>
      </div>

      {items.length ? (
        <div className="fav-grid">
          {items.map((it) => (
            <div key={it.productId} className="fav-card">
              <Link to={it.to} className="fav-link">
                <div className="fav-imgWrap">
                  <img
                    className="fav-img"
                    src={it.img}
                    alt={it.name}
                    loading="lazy"
                    onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                  />
                  {it.hasDiscount ? <div className="fav-badge">-{Math.round(it.discount)}%</div> : null}
                </div>

                <div className="fav-meta">
                  <div className="fav-name" title={it.name}>
                    {it.missingProduct ? (ua ? "Товар недоступний" : "Product unavailable") : it.name}
                  </div>

                  <div className="fav-price">
                    {it.price > 0 ? (
                      <>
                        {it.hasDiscount ? <span className="fav-old">{formatUAH(it.price)}</span> : null}
                        <span className="fav-now">{formatUAH(it.finalPrice)}</span>
                      </>
                    ) : (
                      <span className="fav-now">—</span>
                    )}
                  </div>
                </div>
              </Link>

              <button
                type="button"
                className="fav-remove"
                disabled={isLoading}
                onClick={() => toggleLike({ _id: it.productId, ...it.rawLike })}
                title={ua ? "Видалити з обраного" : "Remove from favorites"}
              >
                {ua ? "Видалити" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="fav-empty">
          {ua ? "Поки що немає лайкнутих товарів." : "No liked products yet."}
          <div style={{ marginTop: 10 }}>
            <Link className="fav-btn" to="/catalog">{ua ? "Перейти в каталог" : "Go to catalog"}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
