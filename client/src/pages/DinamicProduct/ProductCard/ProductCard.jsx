import React from "react";
import { Link } from "react-router-dom";

import LikesComponent from "../../../components/Likes/LikesComponent";
import DiscountBadge from "../../../components/DiscountBadge/DiscountBadge";
import BuyButton from "../BuyButton/BuyButton";
import Price from "../Price/Price";
import Articule from "../Articule/Articule";
import RatingStars from "../RatingStars/RatingStars";
import Model3DIcon from "../Model3DIcon/Model3DIcon";

import { IoCheckmarkCircleOutline, IoTimeOutline, IoCubeOutline } from "react-icons/io5";

import "./ProductCard.css";

/* ---------- helpers ---------- */
const joinUrl = (base, raw) => {
  if (!raw || typeof raw !== "string") return "";
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("/")) return `${base}${raw}`;
  return `${base}/${raw}`.replace(/([^:]\/)\/+/g, "$1");
};

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const pickText = (val, lang = "ua") => {
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "object") return String(val?.[lang] ?? val?.ua ?? val?.en ?? "");
  return "";
};



const COLOR_MAP = {
  black: "#111827",
  blue: "#2563eb",
  red: "#ef4444",
  gray: "#9ca3af",
  grey: "#9ca3af",
  white: "#ffffff",
  beige: "#e7d7c3",
  brown: "#6b4f3a",
  green: "#16a34a",
  yellow: "#f59e0b",
  pink: "#ec4899",
};

const getDimsText = (item) => {
  const w = toNum(item?.specifications?.width ?? item?.width);
  const h = toNum(item?.specifications?.height ?? item?.height);
  const d = toNum(item?.specifications?.depth ?? item?.depth);

  if (!w && !h && !d) return "";
  const parts = [w || "—", h || "—", d || "—"];
  return `${parts.join("×")} см`;
};

export default function ProductCard({
  item,
  apiUrl,
  category,
  subKey,
  lang = "ua",
  rating = 0,
  count = 0,
}) {
  const id = item?._id;
  if (!id) return null;

  const discount = clamp(toNum(item?.discount), 0, 100);
  const oldPriceUAH = toNum(item?.price);
  const hasDiscount = discount > 0 && oldPriceUAH > 0;

  // ✅ UAH-ціна для кошика/БД
  const currentPriceUAH = hasDiscount
    ? Math.round(oldPriceUAH - (oldPriceUAH * discount) / 100)
    : oldPriceUAH;

  const productName =
    pickText(item?.name, lang) || (lang === "ua" ? "Назва товару" : "Product");

  const rawImg =
    item?.image ||
    item?.imageUrl ||
    (Array.isArray(item?.images) ? item.images[0] : "") ||
    item?.productImage;

  const imageSrc = rawImg ? joinUrl(apiUrl, rawImg) : "/placeholder.png";

  const detailsLink = `/catalog/${encodeURIComponent(category)}/${encodeURIComponent(
    subKey
  )}/${id}`;

  const dimsText = getDimsText(item);

  const inStock = item?.inStock !== undefined ? !!item.inStock : true;
  const deliveryDays = item?.deliveryDays ?? item?.delivery ?? null;

  const colorKeys = Array.isArray(item?.colorKeys) ? item.colorKeys : [];
const skuText = String(item?.sku || "").trim();

  return (
    <article className="hth-card">
      {/* MEDIA */}
      <div className="hth-media">
        {/* badge знижки на фото */}
        {hasDiscount && (
          <div className="badge-wrapper">
            <DiscountBadge discount={discount} />
          </div>
        )}

        {/* actions top-right */}
        <div className="hth-actions">
          <div className="hth-action-btn">
            <LikesComponent product={item} />
          </div>
            <Model3DIcon item={item} to={detailsLink} lang={lang} />

        </div>

        <Link to={detailsLink} className="hth-img-link">
          <img
            className="hth-img"
            src={imageSrc}
            alt={productName}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.png";
            }}
          />
        </Link>
      </div>

      {/* META ROW */}
      <div className="hth-meta">
        <div className="hth-meta-left">
{count > 0 ?   <RatingStars value={rating} count={count}  /> : <span className="hth-meta-spacer" />}
        </div>

        <div className="hth-meta-right">
          {inStock ? (
            <span className="hth-stock">
              <IoCheckmarkCircleOutline size={18} />
              <span>{lang === "ua" ? "В наявності" : "In stock"}</span>
            </span>
          ) : deliveryDays ? (
            <span className="hth-delivery">
              <IoTimeOutline size={18} />
              <span>
                {String(deliveryDays)} {lang === "ua" ? "днів" : "days"}
              </span>
            </span>
          ) : (
            <span className="hth-delivery">
              <IoTimeOutline size={18} />
              <span>{lang === "ua" ? "Під замовлення" : "Made to order"}</span>
            </span>
          )}
        </div>
      </div>

      {/* DIMS */}
      {dimsText && (
        <div className="hth-dims" title="Габарити">
          <span className="hth-dims-icon">↕</span>
          <span>{dimsText}</span>
        </div>
      )}

      {/* TITLE */}
      <Link to={detailsLink} className="hth-title" title={productName}>
        {productName}
      </Link>

      {/* SKU */}
{/* ARTICULE (кусок кода) */}
<Articule
  skuFull={skuText}
  tailParts={2}
  label={lang === "ua" ? "Артикул" : "SKU"}
/>

      {/* PRICE (✅ простий Price) */}
<div className="hth-price hth-price--center">
  {hasDiscount && (
    <Price value={oldPriceUAH} suffix="грн." className="price--old" />
  )}
  <Price value={currentPriceUAH} suffix="грн." className="price--new" />
</div>


      {/* COLORS */}
      {!!colorKeys.length && (
        <div className="hth-colors">
          {colorKeys.slice(0, 4).map((k) => (
            <span
              key={k}
              className="hth-swatch"
              title={k}
              style={{ background: COLOR_MAP[k] || "#d1d5db" }}
              data-ring={k === "white" ? "1" : "0"}
            />
          ))}

          {colorKeys.length > 4 && (
            <span className="hth-more" title="More colors">
              +{colorKeys.length - 4}
            </span>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="hth-cta">
        <BuyButton
          item={item}
          productName={productName}
          currentPrice={currentPriceUAH}
          oldPrice={oldPriceUAH}
          category={category}
          subCategory={subKey}
        />
      </div>
    </article>
  );
}
