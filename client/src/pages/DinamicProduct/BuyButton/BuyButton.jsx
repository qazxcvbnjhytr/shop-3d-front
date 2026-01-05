// client/src/pages/DinamicProduct/BuyButton/BuyButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import "./BuyButton.css";

const BuyButton = ({ item }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const handleBuy = (e) => {
    e.preventDefault();
    
    // Беремо ТІЛЬКИ ID
    const productId = item?._id || item?.id;

    if (!productId) {
      console.error("❌ Помилка: ID товару не знайдено!");
      return;
    }

    // Шлемо в контекст ТІЛЬКИ ID (рядок)
    addItem(productId, 1);

    // Летимо в кошик
    navigate("/shopping-cart");
  };

  return (
    <button type="button" className="dp-buy-btn" onClick={handleBuy}>
      Купити
    </button>
  );
};

export default BuyButton;