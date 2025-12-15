import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import s from "../UserLikes.module.css"; // <-- ВАЖЛИВО: твій CSS лежить на рівень вище

function getId(v) {
  if (!v) return null;
  if (typeof v === "string" || typeof v === "number") return v;
  return v.productId || v._id || v.id || null;
}

function pickText(val, language = "uk") {
  if (!val) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);

  // якщо це {ua,en} або подібна структура
  if (typeof val === "object") {
    return (
      val?.[language] ||
      val?.ua ||
      val?.uk ||
      val?.en ||
      val?.ru ||
      ""
    );
  }
  return "";
}

function formatUAH(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("uk-UA");
}

export default function UserLikes({
  likes = [],
  toggleLike,
  language = "uk",
  apiUrl,
  token,
  onAddToCart,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Якщо likes уже містить повні продукти (а не просто id) — беремо їх без fetch
  const normalizedLikesAsProducts = useMemo(() => {
    const arr = Array.isArray(likes) ? likes : [];
    const maybeProducts = arr
      .map((x) => (x?.product ? x.product : x)) // якщо like = {product: {...}}
      .filter((x) => typeof x === "object" && (x?.name || x?.title || x?.price || x?.image || x?._id));

    return maybeProducts;
  }, [likes]);

  const ids = useMemo(() => {
    // якщо є готові продукти — ids не потрібні
    if (normalizedLikesAsProducts.length) return [];
    const raw = (likes || []).map(getId).filter(Boolean);
    return Array.from(new Set(raw));
  }, [likes, normalizedLikesAsProducts.length]);

  const headers = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const buildImage = useCallback(
    (p) => {
      const raw =
        p?.image || p?.imageUrl || p?.images?.[0] || p?.imageFile || p?.photo;

      if (!raw) return "";
      if (typeof raw !== "string") return "";

      if (raw.startsWith("http")) return raw;
      if (raw.startsWith("/")) return `${apiUrl}${raw}`;

      return `${apiUrl}/${raw}`.replace(/\/{2,}/g, "/").replace(":/", "://");
    },
    [apiUrl]
  );

  const addToCartLocalFallback = useCallback((product) => {
    const id = product?._id || product?.id;
    if (!id) return;

    const key = "cart";
    const cart = JSON.parse(localStorage.getItem(key) || "[]");
    const idx = cart.findIndex((x) => String(x.productId) === String(id));

    if (idx >= 0) cart[idx].qty = (cart[idx].qty || 1) + 1;
    else cart.push({ productId: id, qty: 1 });

    localStorage.setItem(key, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("cart:updated"));
  }, []);

  const handleAddToCart = useCallback(
    (product) => {
      if (typeof onAddToCart === "function") return onAddToCart(product);
      return addToCartLocalFallback(product);
    },
    [onAddToCart, addToCartLocalFallback]
  );

  const fetchProducts = useCallback(async () => {
    setErr("");

    // 1) якщо вже є готові продукти з likes — просто ставимо їх
    if (normalizedLikesAsProducts.length) {
      setItems(normalizedLikesAsProducts);
      return;
    }

    // 2) якщо немає id — нічого не робимо
    if (!ids.length) {
      setItems([]);
      return;
    }

    setLoading(true);
    setItems([]);

    try {
      // У тебе НЕМА /by-ids, тому одразу по одному:
      const res = await Promise.allSettled(
        ids.map((id) =>
          axios.get(`${apiUrl}/api/products/${id}`, { headers })
        )
      );

      const list = res
        .filter((x) => x.status === "fulfilled")
        .map((x) => x.value.data)
        .filter(Boolean);

      setItems(list);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Load error");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, headers, ids, normalizedLikesAsProducts]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchProducts();
    })();
    return () => {
      mounted = false;
    };
  }, [fetchProducts]);

  const title = language === "en" ? "Wishlist" : "Список бажань";
  const tProduct = "PRODUCT NAME";
  const tPrice = "UNIT PRICE";
  const tAdd = language === "en" ? "Add to cart" : "Додати в кошик";
  const tEmpty = language === "en" ? "Wishlist is empty" : "Список бажань порожній";

  return (
    <section className={s.wrap}>
      <h1 className={s.title}>{title}</h1>

      <div className={s.tableHead}>
        <div className={s.thLeft}>{tProduct}</div>
        <div className={s.thRight}>{tPrice}</div>
      </div>

      {loading ? <div className={s.state}>Loading...</div> : null}
      {err ? <div className={s.error}>{err}</div> : null}

      {!loading && !err && !items.length ? (
        <div className={s.empty}>{tEmpty}</div>
      ) : null}

      <div className={s.list}>
        {items.map((p) => {
          const id = p?._id || p?.id || p?.productId;

          // ✔️ ВАЖЛИВО: name може бути {ua,en}
          const name =
            pickText(p?.name, language) ||
            pickText(p?.title, language) ||
            pickText(p?.name_ua, language) ||
            pickText(p?.name_en, language) ||
            "—";

          const img = buildImage(p);

          const price = p?.price ?? null;
          const discount = Number(p?.discount || 0);

          const newPrice =
            price !== null
              ? discount > 0
                ? Math.round(Number(price) * (1 - discount / 100))
                : Number(price)
              : null;

          const oldPrice = discount > 0 && price !== null ? Number(price) : null;

          return (
            <div className={s.row} key={String(id)}>
              <button
                className={s.remove}
                type="button"
                aria-label="Remove"
                title="Remove"
                onClick={() => toggleLike(id)}
              >
                ×
              </button>

              <div className={s.thumb}>
                {img ? <img src={img} alt={name} /> : <div className={s.ph} />}
              </div>

              <div className={s.name}>
                <Link className={s.nameLink} to={`/product/${id}`}>
                  {name}
                </Link>
              </div>

              <div className={s.price}>
                {oldPrice ? (
                  <span className={s.old}>{formatUAH(oldPrice)} грн</span>
                ) : null}
                {newPrice !== null ? (
                  <span className={s.new}>{formatUAH(newPrice)} грн</span>
                ) : (
                  <span className={s.new}>—</span>
                )}
              </div>

              <button className={s.cartBtn} type="button" onClick={() => handleAddToCart(p)}>
                {tAdd}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
