import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import "./ShoppingCart.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const formatUAH = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0 грн";
  return `${num.toLocaleString("uk-UA")} грн`;
};

const joinUrl = (base, raw) => {
  if (!raw || typeof raw !== "string") return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;

  const b = String(base || "").replace(/\/+$/, "");
  if (raw.startsWith("/")) return `${b}${raw}`;
  return `${b}/${raw}`.replace(/\/{2,}/g, "/").replace(":/", "://");
};

export default function ShoppingCart() {
  const navigate = useNavigate();

  const { items, isEmpty, totalItems, cartTotal, updateItemQuantity, removeItem, emptyCart } =
    useCart();

  const summary = useMemo(() => {
    const subtotal = Number(cartTotal) || 0;
    const shipping = 0;
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  }, [cartTotal]);

  if (isEmpty) {
    return (
      <div className="sc-page">
        <div className="sc-empty">
          <h1 className="sc-title">Кошик замовлень</h1>
          <p className="sc-empty-text">Ваш кошик порожній.</p>

          <div className="sc-empty-actions">
            <button className="sc-btn sc-btn--primary" onClick={() => navigate("/catalog")}>
              Перейти в каталог
            </button>
            <button className="sc-btn sc-btn--ghost" onClick={() => navigate(-1)}>
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-page">
      {/* TOP BAR */}
      <div className="sc-top">
        <h1 className="sc-title">Кошик замовлень</h1>

        <div className="sc-top-actions">
          <span className="sc-pill">{totalItems} товар(ів)</span>

          <button className="sc-linkDanger" type="button" onClick={emptyCart}>
            Очистити кошик
          </button>
        </div>
      </div>

      {/* TABLE CARD */}
      <section className="sc-tableCard" aria-label="Cart table">
        <div className="sc-row sc-head">
          <div className="sc-cell sc-img">Зображення</div>
          <div className="sc-cell sc-name">Найменування товару</div>
          <div className="sc-cell sc-qty">Кількість</div>
          <div className="sc-cell sc-unit">Ціна за шт.</div>
          <div className="sc-cell sc-total">Усього</div>
        </div>

        {items.map((it) => {
          const qty = Math.max(1, Number(it.quantity) || 1);
          const canDec = qty > 1;

          const productHref = it.category
            ? `/catalog/${it.category}/${it.id}`
            : `/catalog/${it.id}`;

          const rawImg =
            it.image ||
            it.imageUrl ||
            it.productImage ||
            it?.product?.image ||
            it?.product?.imageUrl ||
            "";

          const imgSrc = rawImg ? joinUrl(API_URL, rawImg) : "/placeholder.png";

          const unitPrice = Number(it.price) || 0;
          const lineTotal = unitPrice * qty;

          return (
            <div className="sc-row sc-item" key={it.id}>
              <div className="sc-cell sc-img">
                <Link to={productHref} className="sc-imgLink" title="Відкрити товар">
                  <img
                    className="sc-imgEl"
                    src={imgSrc}
                    alt={it.name || "Product"}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.png";
                    }}
                  />
                </Link>
              </div>

              <div className="sc-cell sc-name">
                <Link to={productHref} className="sc-nameLink" title={it.name || "Товар"}>
                  {it.name || "Товар"}
                </Link>

                <div className="sc-nameActions">
                  <button
                    type="button"
                    className="sc-removeLink"
                    onClick={() => removeItem(it.id)}
                  >
                 
                  </button>
                </div>
              </div>

              <div className="sc-cell sc-qty">
                <div className="sc-qtyCtrl" aria-label="Quantity controls">
                  <button
                    type="button"
                    className="sc-qtyBtn"
                    disabled={!canDec}
                    onClick={() => updateItemQuantity(it.id, qty - 1)}
                    aria-label="Зменшити кількість"
                  >
                    –
                  </button>

                  <span className="sc-qtyNum" aria-label={`Кількість: ${qty}`}>
                    {qty}
                  </span>

                  <button
                    type="button"
                    className="sc-qtyBtn"
                    onClick={() => updateItemQuantity(it.id, qty + 1)}
                    aria-label="Збільшити кількість"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="sc-cell sc-unit" data-label="Ціна за шт.">
                {formatUAH(unitPrice)}
              </div>

              <div className="sc-cell sc-total" data-label="Усього">
                {formatUAH(lineTotal)}
              </div>
            </div>
          );
        })}
      </section>

      {/* FOOTER (continue + totals + checkout) */}
      <div className="sc-bottom">
        <button
          type="button"
          className="sc-btn sc-btn--ghost"
          onClick={() => navigate("/catalog")}
        >
          Продовжити покупки
        </button>

        <div className="sc-bottom-right">
          <div className="sc-totals">
            <div className="sc-totRow">
              <span>Разом:</span>
              <b>{formatUAH(summary.subtotal)}</b>
            </div>

            <div className="sc-totRow">
              <span>Всього:</span>
              <b>{formatUAH(summary.total)}</b>
            </div>
          </div>

          <button
            type="button"
            className="sc-btn sc-btn--primary sc-checkout"
            onClick={() => {
              alert("Оформлення замовлення буде на наступному кроці (checkout).");
            }}
          >
            ОФОРМЛЕННЯ ЗАМОВЛЕННЯ
          </button>
        </div>
      </div>
    </div>
  );
}
