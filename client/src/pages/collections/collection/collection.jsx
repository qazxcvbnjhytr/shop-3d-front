import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "../../../hooks/useTranslation";
import "./collection.css";

const RAW_API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const normalizeBase = (raw) => {
  const s = String(raw || "").replace(/\/+$/, "");
  return s.replace(/\/api\/?$/, "");
};
const BASE = normalizeBase(RAW_API);

const normalizeProducts = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const toKey = (v) => String(v || "").trim().toLowerCase();

const productHasCollectionKey = (product, key) => {
  const k = toKey(key);
  if (!k) return false;

  const arr = Array.isArray(product?.collectionKeys) ? product.collectionKeys : [];
  return arr.some((x) => toKey(x) === k);
};

export default function CollectionPage() {
  const { t } = useTranslation();
  const { key } = useParams(); // /collections/:key

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        // ✅ Гарантовано: беремо всі товари і фільтруємо по collectionKeys
        const res = await axios.get(`${BASE}/api/products`);
        if (!alive) return;
        setProducts(normalizeProducts(res.data));
      } catch  {
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
  }, [key]);

  const filtered = useMemo(() => {
    return (products || []).filter((p) => productHasCollectionKey(p, key));
  }, [products, key]);

  const title = t?.collections?.[key] || key || "Колекція";
  const subtitle =
    t?.collectionsPage?.subtitleOne ||
    `Товари з колекції "${title}"`;

  return (
    <div className="collection-page">
      <div className="collection-head">
        <div className="collection-breadcrumbs">
          <Link className="collection-back" to="/collections">← Колекції</Link>
          <Link className="collection-back" to="/catalog">Каталог</Link>
        </div>

        <h1 className="collection-title">{title}</h1>
        <div className="collection-key">key: {key}</div>
        <p className="collection-subtitle">{subtitle}</p>
      </div>

      {loading ? (
        <div className="collection-state">Loading…</div>
      ) : err ? (
        <div className="collection-state error">{err}</div>
      ) : filtered.length === 0 ? (
        <div className="collection-state">
          Немає товарів з ключем <b>{key}</b> у <code>collectionKeys</code>.
        </div>
      ) : (
        <>
          <div className="collection-meta">
            Знайдено: <b>{filtered.length}</b>
          </div>

          <div className="collection-grid">
            {filtered.map((p) => {
              const id = String(p?._id?.$oid || p?._id || "");
              const name = p?.name?.ua || p?.name?.en || p?.name || "Товар";
              const img = Array.isArray(p?.images) ? p.images[0] : p?.image;

              // твій роут на товар: /catalog/:category/:sub/:id
              const to =
                p?.category && p?.subCategory && id
                  ? `/catalog/${p.category}/${p.subCategory}/${id}`
                  : "/catalog";

              return (
                <Link key={id || name} to={to} className="collection-card-item">
                  <div className="collection-card-imgWrap">
                    <img
                      src={img || "/placeholder.png"}
                      alt={name}
                      loading="lazy"
                      onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                    />
                  </div>

                  <div className="collection-card-body">
                    <div className="collection-card-name">{name}</div>
                    <div className="collection-card-sub">
                      {p?.category} / {p?.subCategory}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
