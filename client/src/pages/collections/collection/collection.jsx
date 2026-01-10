import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import "./collection.css";

const RAW_API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE = String(RAW_API).replace(/\/+$/, "").replace(/\/api\/?$/, "");

// Допоміжна функція для отримання тексту
const getText = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val;
  // Якщо це об'єкт {ua, en}, повертаємо ua або en
  if (typeof val === "object") {
    return val.ua || val.en || "";
  }
  return String(val);
};

export default function CollectionPage() {
  const { key } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    axios.get(`${BASE}/api/products`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.products || []);
        if (alive) setProducts(data);
      })
      .catch(() => alive && setProducts([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const k = (key || "").toLowerCase();
    return products.filter(p => {
      const keys = Array.isArray(p.collectionKeys) ? p.collectionKeys : [];
      return keys.some(x => String(x).toLowerCase() === k);
    });
  }, [products, key]);

  return (
    <div className="col-page">
      <div className="col-header">
        <div className="col-crumbs">
          <Link to="/collections">Колекції</Link> / <span>{key}</span>
        </div>
        <h1 className="col-title">{key}</h1>
        <div className="col-meta">{filtered.length} об'єктів</div>
      </div>

      <div className="col-grid">
        {loading ? (
          <div>Завантаження...</div>
        ) : filtered.length === 0 ? (
          <div>В цій колекції поки немає товарів.</div>
        ) : (
          filtered.map(p => {
            // Використовуємо getText, щоб уникнути помилки Objects are not valid
            const name = getText(p.name || "Товар");
            const image = p.image || (Array.isArray(p.images) ? p.images[0] : null) || "/placeholder.png";
            
            return (
              <Link key={p._id} to={`/catalog/${p.category}/${p.subCategory}/${p._id}`} className="col-item">
                <div className="col-item__img">
                  <img src={image} alt={name} loading="lazy" />
                </div>
                <div className="col-item__info">
                  <div className="col-item__name">{name}</div>
                  <div className="col-item__price">
                    {p.finalPrice ? p.finalPrice.toLocaleString() : (p.price || 0).toLocaleString()} грн
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}