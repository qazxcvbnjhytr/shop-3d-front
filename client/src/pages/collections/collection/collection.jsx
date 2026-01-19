import React, { useEffect, useState, useMemo, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import "./collection.css";

import api from "@api/api.js";
import { getImageUrl } from "../../utils/imageUtils.js";
import { LanguageContext } from "@context/LanguageContext";

// Допоміжна функція для отримання тексту (ua/en)
const getText = (val, language = "ua") => {
  if (!val) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);

  if (typeof val === "object") {
    const lang = String(language || "ua").toLowerCase();
    return val?.[lang] || val?.ua || val?.uk || val?.en || "";
  }

  return String(val);
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// discount = % (0..100)
const calcFinalPrice = (price, discountPercent) => {
  const p = toNumber(price);
  const d = Math.min(100, Math.max(0, toNumber(discountPercent)));
  return d > 0 ? Math.round((p * (100 - d)) / 100) : p;
};

export default function CollectionPage() {
  const { key } = useParams();
  const { language } = useContext(LanguageContext);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        // ✅ api instance already has baseURL = .../api
        const res = await api.get("/products");
        const data = Array.isArray(res.data) ? res.data : (res.data?.products || []);
        if (alive) setProducts(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setProducts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const k = (key || "").toLowerCase();
    return (products || []).filter((p) => {
      const keys = Array.isArray(p?.collectionKeys) ? p.collectionKeys : [];
      return keys.some((x) => String(x).toLowerCase() === k);
    });
  }, [products, key]);

  return (
    <div className="col-page">
      <div className="col-header">
        <div className="col-crumbs">
          <Link to="/collections">Колекції</Link> / <span>{key}</span>
        </div>

        <h1 className="col-title">{key}</h1>
        <div className="col-meta">{filtered.length} об&apos;єктів</div>
      </div>

      <div className="col-grid">
        {loading ? (
          <div>Завантаження...</div>
        ) : filtered.length === 0 ? (
          <div>В цій колекції поки немає товарів.</div>
        ) : (
          filtered.map((p) => {
            const name = getText(p?.name, language) || "Товар";
            const imgRaw = p?.image || (Array.isArray(p?.images) ? p.images[0] : "") || "";
            const image = imgRaw ? getImageUrl(imgRaw) : "/placeholder.png";

            const price = toNumber(p?.price);
            const discount = toNumber(p?.discount);
            const finalPrice = calcFinalPrice(price, discount);

            const category = p?.category || "all";
            const subCategory = p?.subCategory || "product";
            const id = String(p?._id || "");

            return (
              <Link key={id} to={`/catalog/${category}/${subCategory}/${id}`} className="col-item">
                <div className="col-item__img">
                  <img
                    src={image}
                    alt={name}
                    loading="lazy"
                    onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                  />
                </div>

                <div className="col-item__info">
                  <div className="col-item__name">{name}</div>
                  <div className="col-item__price">
                    {finalPrice.toLocaleString("uk-UA")} грн
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
