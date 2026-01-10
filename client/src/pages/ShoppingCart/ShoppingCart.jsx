import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import "./ShoppingCart.css";

import Price from "../DinamicProduct/Price/Price.jsx";
import Articule from "../DinamicProduct/Articule/Articule.jsx";
import DiscountBadge from "../../components/DiscountBadge/DiscountBadge.jsx";

export default function ShoppingCart() {
  const navigate = useNavigate();
  const {
    loading,
    items,
    isEmpty,
    totalItems,
    subtotal,
    totalSavings,
    cartTotal,
    updateItemQuantity,
    removeItem,
    emptyCart,
  } = useCart();

  if (loading) return <div className="cart-loader">Завантаження...</div>;

  if (isEmpty) {
    return (
      <div className="cart-page">
        <div className="cart-shell empty-center">
          <h1 className="cart-title">Кошик порожній</h1>
          <button className="btn-primary" onClick={() => navigate("/catalog")}>На головну</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-shell">
        {/* Шапка кошика */}
        <div className="cart-head">
          <h1 className="cart-title">
            Кошик замовлень <span className="cart-count">({totalItems})</span>
          </h1>
          <button className="btn-linkDanger" onClick={emptyCart}>Очистити все</button>
        </div>

        {/* Таблиця товарів */}
        <div className="cart-tableWrap">
          <table className="cart-table">
            <thead>
              <tr>
                <th className="th-product">Товар</th>
                <th className="th-price">Ціна</th>
                <th className="th-discount">Знижка</th>
                <th className="th-saving">Економія</th>
                <th className="th-qty">Кількість</th>
                <th className="th-sum">Сума</th>
                <th className="th-x"></th>
              </tr>
            </thead>

            <tbody>
              {items.map((it) => {
                const hasDiscount = it.discountPct > 0;
                return (
                  <tr key={it.productId}>
                    <td className="td-product">
                      <img
                        className="p-img"
                        src={it.imageSrc}
                        alt={it.name}
                        onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                      />
                      <div className="p-info">
                        <Link to={it.href} className="p-title">{it.name}</Link>
                        <Articule skuFull={it.sku} tailParts={6} label="SKU" />
                      </div>
                    </td>

                    <td className="td-price">
                      <div className="price-stack">
                        {hasDiscount ? (
                          <>
                            <span className="price-old-label">{Math.round(it.oldPrice)} грн</span>
                            <span className="price-new-label">{Math.round(it.finalPrice)} грн</span>
                          </>
                        ) : (
                          <span className="price-normal">{Math.round(it.finalPrice)} грн</span>
                        )}
                      </div>
                    </td>

                    <td className="td-discount">
                      {hasDiscount ? (
                        <DiscountBadge discount={it.discountPct} mode="percent" variant="inline" />
                      ) : (
                        <span className="dash">—</span>
                      )}
                    </td>

                    <td className="td-saving">
                      {it.lineSavings > 0 ? (
                        <span className="savingVal">{Math.round(it.lineSavings)} грн</span>
                      ) : (
                        <span className="dash">—</span>
                      )}
                    </td>

                    <td className="td-qty">
                      <div className="qty-ui">
                        <button className="qty-btn" onClick={() => updateItemQuantity(it.productId, it.qty - 1)} disabled={it.qty <= 1}>–</button>
                        <span className="qty-val">{it.qty}</span>
                        <button className="qty-btn" onClick={() => updateItemQuantity(it.productId, it.qty + 1)}>+</button>
                      </div>
                    </td>

                    <td className="td-sum">
                      <span className="sum-val">{Math.round(it.lineTotal)} грн</span>
                    </td>

                    <td className="td-x">
                      <button className="xbtn" onClick={() => removeItem(it.productId)}>×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Нижня частина: Кнопка та Чек */}
        <div className="cart-bottom">
          <button className="btn-continue" onClick={() => navigate("/catalog")}>
            Продовжити покупки
          </button>

          <div className="cart-summary">
            <div className="summary-content">
              <div className="sumRow">
                <span>Сума за товари:</span>
                <span className="val-dark">{Math.round(subtotal).toLocaleString()} грн</span>
              </div>
              
              {totalSavings > 0 && (
                <div className="sumRow sumRow-save">
                  <span>Ваша економія:</span>
                  <span className="sumSave">- {Math.round(totalSavings).toLocaleString()} грн</span>
                </div>
              )}
              
              <div className="sumRow sumRow-total">
                <span>Разом до сплати:</span>
                <span className="grand-total">{Math.round(cartTotal).toLocaleString()} грн</span>
              </div>
            </div>
<button className="btn-checkout" type="button" onClick={() => navigate("/checkout")}>
  ОФОРМИТИ ЗАМОВЛЕННЯ
</button>

          </div>
        </div>
      </div>
    </div>
  );
}