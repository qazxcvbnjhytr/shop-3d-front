// client/src/components/Likes/LikesComponent.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { FaHeart } from "react-icons/fa";
import { useLikes } from "../../context/LikesContext";
import { useAuth } from "../../context/AuthContext";
import "./Likes.css";

const pickText = (value, language = "ua") => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const lang = language === "uk" ? "ua" : language;
    return value?.[lang] || value?.[language] || value?.ua || value?.uk || value?.en || "";
  }
  return "";
};

const LikesComponent = ({ product }) => {
  const { toggleLike, isLiked, isLoading } = useLikes();
  const { user } = useAuth();

  const productId = String(product?._id || product?.id || product?.productId || "");
  const liked = productId ? isLiked(productId) : false;

  const normalizedProduct = useMemo(() => {
    if (!product || !productId) return null;

    const nameStr =
      pickText(product?.name, "ua") ||
      pickText(product?.name, "en") ||
      pickText(product?.name_ua, "ua") ||
      pickText(product?.name_en, "en") ||
      String(product?.title || "") ||
      "Товар";

    const imageStr =
      (typeof product?.image === "string" && product.image) ||
      (typeof product?.imageUrl === "string" && product.imageUrl) ||
      (Array.isArray(product?.images) && typeof product.images[0] === "string" ? product.images[0] : "") ||
      (typeof product?.productImage === "string" && product.productImage) ||
      "";

    return {
      ...product,
      _id: product?._id || product?.id || productId,
      productId,
      name: nameStr,
      category: product?.category || product?.productCategory || "",
      image: imageStr,
      discount: Number(product?.discount || 0),
      price: Number(product?.price || 0),
    };
  }, [product, productId]);

  if (!product || !productId) return null;

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;

    if (!user) {
      alert("Будь ласка, увійдіть, щоб додавати товари до улюблених.");
      return;
    }

    if (!normalizedProduct) return;
    await toggleLike(normalizedProduct);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`like-button ${liked ? "liked" : "unliked"} ${isLoading ? "loading" : ""}`}
      aria-label={liked ? "Видалити з улюблених" : "Додати до улюблених"}
      title={liked ? "Видалити з улюблених" : "Додати до улюблених"}
      disabled={isLoading}
    >
      <FaHeart className={`heart-icon ${liked ? "is-liked" : "is-unliked"}`} />
    </button>
  );
};

LikesComponent.propTypes = {
  product: PropTypes.object,
};

export default LikesComponent;
