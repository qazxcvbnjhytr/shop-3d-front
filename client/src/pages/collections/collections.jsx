// client/src/pages/collections/collections.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import CollectionCard from "./CollectionCard/CollectionCard.jsx";
import "./collections.css";

import api from "../../../api/api.js";
import { getImageUrl } from "../../utils/imageUtils.js";

const normalizeProducts = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const getCollectionKeys = (p) => {
  if (!p) return [];
  if (Array.isArray(p.collectionKeys)) return p.collectionKeys.filter((x) => typeof x === "string");
  if (typeof p.collectionKey === "string" && p.collectionKey.trim()) return [p.collectionKey.trim()];
  return [];
};

const pickImageRaw = (p) => {
  return (Array.isArray(p?.images) && p.images[0]) || p?.image || "";
};

export default function CollectionsPage() {
  const { t } = useTranslation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        // ✅ api instance already has baseURL = .../api
        const res = await api.get("/products");
        if (!alive) return;

        setProducts(normalizeProducts(res.data));
      } catch {
        if (!alive) return;
        setProducts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const collections = useMemo(() => {
    const map = new Map();

    for (const p of products) {
      const keys = getCollectionKeys(p);

      for (const key of keys) {
        const kLower = key.toLowerCase();

        if (!map.has(kLower)) {
          const raw = pickImageRaw(p);
          map.set(kLower, {
            key,
            count: 0,
            image: raw ? getImageUrl(raw) : "/placeholder.png",
          });
        }

        const item = map.get(kLower);
        item.count++;

        // Якщо у попереднього товара не було фото, а у цього є — беремо нове
        if (!item.image || item.image === "/placeholder.png") {
          const raw = pickImageRaw(p);
          if (raw) item.image = getImageUrl(raw);
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [products]);

  const title = t?.collectionsPage?.title || "Авторські Колекції";
  const subtitle =
    t?.collectionsPage?.subtitle ||
    "Унікальні рішення для вашого інтер'єру, об'єднані єдиним стилем.";
  const loadingTxt = t?.common?.loading || "Завантаження...";
  const emptyTxt = t?.collectionsPage?.empty || "Колекцій поки немає.";

  return (
    <div className="cls-page">
      <div className="cls-hero">
        <div className="cls-hero__content">
          <h1 className="cls-title">{title}</h1>
          <p className="cls-sub">{subtitle}</p>
        </div>
      </div>

      <div className="cls-container">
        {loading ? (
          <div className="cls-state">{loadingTxt}</div>
        ) : collections.length === 0 ? (
          <div className="cls-state">{emptyTxt}</div>
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
