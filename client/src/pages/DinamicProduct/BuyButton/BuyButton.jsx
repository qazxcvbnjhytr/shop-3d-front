// client/src/pages/DinamicProduct/BuyButton/BuyButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import { IoBagHandleOutline } from "react-icons/io5"; // Преміальна іконка сумки
import "./BuyButton.css";

const BuyButton = ({ item }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const handleBuy = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Важливо, щоб не спрацював перехід на сторінку товару

    const productId = item?._id || item?.id;

    if (!productId) {
      console.error("❌ ID товару не знайдено!");
      return;
    }

    addItem(productId, 1);
    navigate("/shopping-cart");
  };

  return (
    <button type="button" className="dp-buy-btn" onClick={handleBuy}>
      <span className="btn-label">Купити</span>
      <span className="btn-icon">
        <IoBagHandleOutline size={18} />
      </span>
    </button>
  );
};

export default BuyButton;