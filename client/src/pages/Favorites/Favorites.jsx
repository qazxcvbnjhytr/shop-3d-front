import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { useLikes } from "../../context/LikesContext";
import { LanguageContext } from "../../context/LanguageContext";
import { useCart } from "../../context/CartContext";
import "./Favorites.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Favorites() {
  const { likedProducts = [], toggleLike, isLoading } = useLikes();
  const { addItem } = useCart();
  const { language } = useContext(LanguageContext);
  const lang = language === "en" ? "en" : "ua";

  if (isLoading) return <div className="loader">Рівняємо дані...</div>;

  return (
    <div className="fav-page">
      <h1 className="fav-title">Мій вибір ({likedProducts.length})</h1>
      
      <div className="fav-grid">
        {likedProducts.map((item) => {
          // ТУТ МАГІЯ: productId тепер містить весь об'єкт товару з бази shop3d
          const product = item.productId; 

          // Захист: якщо товар видалили з бази, а лайк лишився
          if (!product) return null;

          const price = Number(product.price || 0);
          const discount = Number(product.discount || 0);
          const finalPrice = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;

          return (
            <div key={product._id} className="fav-card">
              <div className="fav-image">
                <img src={`${API_URL}${product.images?.[0]}`} alt={product.name?.[lang]} />
                <button className="del-fav" onClick={() => toggleLike({ productId: product._id })}>×</button>
              </div>
              
              <div className="fav-info">
                <span className="fav-cat">{product.category} / {product.subCategory}</span>
                <Link to={`/product/${product._id}`} className="fav-name">
                  {product.name?.[lang] || product.name?.ua}
                </Link>
                
                <div className="fav-footer">
                  <div className="fav-prices">
                    <span className="curr">{finalPrice} ₴</span>
                    {discount > 0 && <span className="old">{price} ₴</span>}
                  </div>
                  <button 
                    className="to-cart" 
                    onClick={() => addItem(product._id, 1)}
                    disabled={product.inStock === false}
                  >
                    {product.inStock === false ? "Немає" : "Купити"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}