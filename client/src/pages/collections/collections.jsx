// client/src/pages/collections/collections.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "../../hooks/useTranslation";
import CollectionCard from "./CollectionCard/CollectionCard.jsx";
import "./collections.css";

const RAW_API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE = String(RAW_API).replace(/\/+$/, "").replace(/\/api\/?$/, "");

const normalizeProducts = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const getCollectionKeys = (p) => {
  if (!p) return [];
  if (Array.isArray(p.collectionKeys)) return p.collectionKeys.filter(x => typeof x === "string");
  if (typeof p.collectionKey === "string" && p.collectionKey.trim()) return [p.collectionKey.trim()];
  return [];
};

const pickImage = (p) => {
  const raw = (Array.isArray(p?.images) && p.images[0]) || p?.image;
  if (!raw) return null;
  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;
  return raw.startsWith("/") ? raw : `/${raw}`;
};

export default function CollectionsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    axios.get(`${BASE}/api/products`)
      .then(res => alive && setProducts(normalizeProducts(res.data)))
      .catch(() => alive && setProducts([]))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const collections = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const keys = getCollectionKeys(p);
      for (const key of keys) {
        const kLower = key.toLowerCase();
        if (!map.has(kLower)) {
          map.set(kLower, { key: key, count: 0, image: pickImage(p) });
        }
        const item = map.get(kLower);
        item.count++;
        // Якщо у попереднього товара не було фото, а у цього є — беремо нове
        if (!item.image) item.image = pickImage(p);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [products]);

  return (
    <div className="cls-page">
      <div className="cls-hero">
        <div className="cls-hero__content">
          <h1 className="cls-title">Авторські Колекції</h1>
          <p className="cls-sub">Унікальні рішення для вашого інтер'єру, об'єднані єдиним стилем.</p>
        </div>
      </div>

      <div className="cls-container">
        {loading ? (
          <div className="cls-state">Завантаження...</div>
        ) : collections.length === 0 ? (
          <div className="cls-state">Колекцій поки немає.</div>
        ) : (
          <div className="cls-grid">
            {collections.map((c) => (
              <CollectionCard
                key={c.key}
                collectionKey={c.key}
                count={c.count}
                label={c.key}
                image={c.image}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}