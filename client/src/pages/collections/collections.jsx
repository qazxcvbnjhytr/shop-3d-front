import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "../../hooks/useTranslation";
import "./collections.css";
import CollectionCard from "./CollectionCard/CollectionCard.jsx";

const RAW_API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const normalizeBase = (raw) => {
  const s = String(raw || "").replace(/\/+$/, "");
  return s.replace(/\/api\/?$/, "");
};

const BASE = normalizeBase(RAW_API);

const getApiOrigin = (apiUrl) => {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return normalizeBase(apiUrl);
  }
};
const API_ORIGIN = getApiOrigin(RAW_API);

const normalizeProducts = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const toKey = (v) => String(v || "").trim().toLowerCase();

const getCollectionKeysFromProduct = (p) => {
  if (!p) return [];

  if (Array.isArray(p.collectionKeys)) {
    return p.collectionKeys
      .filter((x) => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  if (typeof p.collectionKey === "string" && p.collectionKey.trim()) return [p.collectionKey.trim()];
  if (typeof p.collection === "string" && p.collection.trim()) return [p.collection.trim()];

  if (Array.isArray(p.collections)) {
    return p.collections
      .filter((x) => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
};

const pickFirstImage = (p) => {
  const raw =
    (Array.isArray(p?.images) && typeof p.images[0] === "string" && p.images[0]) ||
    (typeof p?.image === "string" && p.image) ||
    "";

  if (!raw) return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;

  const origin = String(API_ORIGIN || "").replace(/\/+$/, "");
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${origin}${path}`;
};

export default function CollectionsPage() {
  const { t } = useTranslation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await axios.get(`${BASE}/api/products`);
        if (!alive) return;
        setProducts(normalizeProducts(res.data));
      } catch (e) {
        if (!alive) return;
        setErr("Не вдалося завантажити товари. Перевір /api/products");
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
    // keyLower -> { key, count, image }
    const map = new Map();

    for (const p of products || []) {
      const keys = getCollectionKeysFromProduct(p);
      if (!keys.length) continue;

      for (const rawKey of keys) {
        const lower = toKey(rawKey);
        if (!lower) continue;

        const prev = map.get(lower);
        if (prev) {
          map.set(lower, { ...prev, count: prev.count + 1 });
        } else {
          map.set(lower, {
            key: rawKey,
            count: 1,
            image: pickFirstImage(p), // перший товар = превʼю
          });
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.count - a.count || toKey(a.key).localeCompare(toKey(b.key))
    );
  }, [products]);

  const title = t?.collectionsPage?.title || "Колекції";
  const subtitle =
    t?.collectionsPage?.subtitle ||
    "Оберіть колекцію, щоб побачити всі товари з цим ключем (collectionKeys).";

  const empty = t?.collectionsPage?.empty || "Колекцій не знайдено.";
  const toCatalogLabel = t?.collectionsPage?.toCatalog || "Перейти в каталог";

  const labelByKey = (key) => t?.collections?.[toKey(key)] || t?.collections?.[key] || key;

  return (
    <div className="collections-page">
      <div className="collections-head">
        <h1 className="collections-title">{title}</h1>
        <p className="collections-subtitle">{subtitle}</p>

        <Link className="collections-to-catalog" to="/catalog">
          {toCatalogLabel}
        </Link>
      </div>

      {loading ? (
        <div className="collections-state">Loading…</div>
      ) : err ? (
        <div className="collections-state error">{err}</div>
      ) : collections.length === 0 ? (
        <div className="collections-state">{empty}</div>
      ) : (
        <div className="collections-grid">
          {collections.map((c) => (
            <CollectionCard
              key={toKey(c.key)}
              collectionKey={c.key}
              count={c.count}
              label={labelByKey(c.key)}
              image={c.image}
            />
          ))}
        </div>
      )}
    </div>
  );
}
