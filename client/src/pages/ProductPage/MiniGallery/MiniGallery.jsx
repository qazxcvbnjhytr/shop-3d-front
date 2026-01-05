// client/src/pages/ProductPage/MiniGallery/MiniGallery.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import "./MiniGallery.css";

import LikesComponent from "../../../components/Likes/LikesComponent.jsx";
import DiscountBadge from "../../../components/DiscountBadge/DiscountBadge.jsx";
import ImageModal from "./ImageModal/ImageModal.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* helpers */
const makeAbsolute = (raw) => {
  if (!raw) return "";
  const str = typeof raw === "object" ? (raw.url || raw.src || "") : String(raw);
  if (!str) return "";
  if (str.startsWith("http") || str.startsWith("data:")) return str;

  const cleanPath = str.startsWith("/") ? str.slice(1) : str;
  const cleanBase = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  return `${cleanBase}/${cleanPath}`;
};

const getUniqueKey = (fullUrl) => {
  try {
    const decoded = decodeURIComponent(fullUrl);
    const clean = decoded.split("?")[0].split("#")[0];
    return clean.split("/").pop().toLowerCase().trim();
  } catch {
    return String(fullUrl).toLowerCase();
  }
};

export default function MiniGallery({ product }) {
  const imagesArray = useMemo(() => {
    if (!product) return [];

    const galleryList = Array.isArray(product.images) && product.images.length ? product.images : [];
    const singleImage = product.image || product.imageUrl || product.productImage;
    const rawCandidates = galleryList.length ? galleryList : singleImage ? [singleImage] : [];

    const uniqueMap = new Map();
    rawCandidates.forEach((item) => {
      const fullUrl = makeAbsolute(item);
      const key = getUniqueKey(fullUrl);
      if (key && !uniqueMap.has(key)) uniqueMap.set(key, fullUrl);
    });

    return Array.from(uniqueMap.values());
  }, [product]);

  const hasMany = imagesArray.length > 1;
  const [mainIndex, setMainIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setMainIndex(0);
    setModalOpen(false);
  }, [product?._id]);

  const mainSrc = imagesArray[mainIndex] || "/placeholder.png";
  const selectImage = useCallback((idx) => setMainIndex(idx), []);

  if (!imagesArray.length) return null;

  const discount = Number(product?.discount) || 0;
  const hasDiscount = discount > 0;

  const title = product?.name?.ua || product?.name?.en || "Товар";
  const alt = title;

  return (
    <div className="gallery">
      <div className="gallery__main">
        <div
          className="gallery__like"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <LikesComponent product={product} />
        </div>

        {hasDiscount && (
          <div
            className="gallery__badge"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <DiscountBadge discount={discount} />
          </div>
        )}

        <img
          className="gallery__main-img"
          src={mainSrc}
          alt={alt}
          onError={(e) => (e.currentTarget.src = "/placeholder.png")}
          onClick={() => setModalOpen(true)}
        />
      </div>

      {hasMany && <div className="gallery__divider" />}

      {hasMany && (
        <div className="gallery__thumbs">
          {imagesArray.map((imgUrl, idx) => (
            <button
              key={`${idx}-${getUniqueKey(imgUrl)}`}
              type="button"
              className={`gallery__thumb-btn ${idx === mainIndex ? "is-active" : ""}`}
              onClick={() => selectImage(idx)}
            >
              <img className="gallery__thumb-img" src={imgUrl} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <ImageModal
        open={modalOpen}
        images={imagesArray}
        startIndex={mainIndex}
        alt={alt}
        title={title} // ✅ замість кнопок показуємо назву
        onClose={() => setModalOpen(false)}
        onApply={(idx) => setMainIndex(idx)}
      />
    </div>
  );
}
