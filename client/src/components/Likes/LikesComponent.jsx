import React from "react";
import { FaHeart } from "react-icons/fa";
import { useLikes } from "../../context/LikesContext";
import { useAuth } from "../../context/AuthContext";
import "./Likes.css";

const LikesComponent = ({ product }) => {
  const { toggleLike, isLiked, isLoading } = useLikes();
  const { user } = useAuth();

  const productId = String(product?._id || product?.id || "");
  const liked = isLiked(productId);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;

    if (!user) {
      alert("Будь ласка, увійдіть, щоб додавати товари до улюблених.");
      return;
    }
    await toggleLike(product);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`like-btn-minimal ${liked ? "is-active" : ""} ${isLoading ? "is-loading" : ""}`}
      disabled={isLoading}
    >
      <FaHeart />
    </button>
  );
};

export default LikesComponent;