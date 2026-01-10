import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const CartContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE = (() => {
  const b = String(API_URL || "").replace(/\/+$/, "");
  return /\/api(\/|$)/.test(b) ? b : `${b}/api`;
})();
const CART_URL = `${API_BASE}/cart`;

const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return String(API_URL || "").replace(/\/+$/, "").replace(/\/api\/?$/, "");
  }
})();

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("jwt") ||
  "";

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const clampQty = (v) => Math.max(1, Math.floor(toNum(v, 1)));
const clampPct = (v) => Math.max(0, Math.min(99, Math.floor(toNum(v, 0))));

const joinUrl = (origin, raw) => {
  if (!raw || typeof raw !== "string") return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;
  const o = String(origin || "").replace(/\/+$/, "");
  const p = raw.startsWith("/") ? raw : `/${raw}`;
  return `${o}${p}`;
};

// ✅ discount = %
const calcFinalPrice = (price, discountPct) => {
  const p = Math.round(toNum(price, 0));
  const d = clampPct(discountPct);
  if (!p) return 0;
  if (!d) return p;

  const final = p * (1 - d / 100);
  return Math.max(0, Math.round(final));
};

export function CartProvider({ children }) {
  const [rawItems, setRawItems] = useState([]); // [{product, qty}] product може бути populated object
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCart = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setRawItems([]);
      setLoading(false);
      setError("Не авторизовано, token відсутній");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const { data } = await axios.get(`${CART_URL}/`, {
        headers: authHeaders(),
        withCredentials: true,
      });

      setRawItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Cart error";
      setError(String(msg));
      setRawItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(async (productId, qty = 1) => {
    try {
      setError("");
      const { data } = await axios.post(
        `${CART_URL}/add`,
        { productId: String(productId), qty: clampQty(qty) },
        { headers: authHeaders(), withCredentials: true }
      );
      setRawItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(String(e?.response?.data?.message || e?.message || "addItem error"));
    }
  }, []);

  const updateItemQuantity = useCallback(async (productId, qty) => {
    try {
      setError("");
      const { data } = await axios.put(
        `${CART_URL}/qty`,
        { productId: String(productId), qty: clampQty(qty) },
        { headers: authHeaders(), withCredentials: true }
      );
      setRawItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(String(e?.response?.data?.message || e?.message || "qty error"));
    }
  }, []);

  const removeItem = useCallback(async (productId) => {
    try {
      setError("");
      const { data } = await axios.delete(`${CART_URL}/item/${String(productId)}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      setRawItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(String(e?.response?.data?.message || e?.message || "remove error"));
    }
  }, []);

  const emptyCart = useCallback(async () => {
    try {
      setError("");
      const { data } = await axios.delete(`${CART_URL}/clear`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      setRawItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(String(e?.response?.data?.message || e?.message || "clear error"));
    }
  }, []);

  const items = useMemo(() => {
    return (rawItems || [])
      .map((it) => {
        const p = it?.product && typeof it.product === "object" ? it.product : null;
        const productId = p?._id ? String(p._id) : (it?.product ? String(it.product) : "");
        const qty = clampQty(it?.qty);

        const basePrice = Math.round(toNum(p?.price, 0));
        const discountPct = clampPct(p?.discount);

        const finalPrice = calcFinalPrice(basePrice, discountPct);
        const oldPrice = discountPct > 0 ? basePrice : 0;

        const unitSavings = discountPct > 0 ? Math.max(0, basePrice - finalPrice) : 0;
        const lineTotal = finalPrice * qty;
        const lineSavings = unitSavings * qty;

        const rawImg = p?.images?.[0] || p?.image || "";
        const imageSrc = rawImg ? joinUrl(API_ORIGIN, rawImg) : "/placeholder.png";

        const href =
          p?._id ? `/catalog/${p?.category || "all"}/${p?.subCategory || "product"}/${p._id}` : "/catalog";

        const name =
          typeof p?.name === "string" ? p.name :
          p?.name?.ua || p?.name?.en || "Товар";

        return {
          productId,
          qty,
          product: p,
          name,
          sku: p?.sku || "",
          imageSrc,
          href,

          basePrice,
          discountPct,
          finalPrice,
          oldPrice,

          unitSavings,
          lineTotal,
          lineSavings,
        };
      })
      .filter((x) => x.productId);
  }, [rawItems]);

  const totalItems = useMemo(() => items.reduce((a, x) => a + x.qty, 0), [items]);
  const cartTotal = useMemo(() => items.reduce((a, x) => a + x.lineTotal, 0), [items]);
  const subtotal = useMemo(() => items.reduce((a, x) => a + x.basePrice * x.qty, 0), [items]);
  const totalSavings = useMemo(() => Math.max(0, subtotal - cartTotal), [subtotal, cartTotal]);

  const isEmpty = items.length === 0;

  const value = useMemo(
    () => ({
      loading,
      error,

      items,
      isEmpty,
      totalItems,

      cartTotal,
      subtotal,
      totalSavings,

      fetchCart,
      addItem,
      updateItemQuantity,
      removeItem,
      emptyCart,
    }),
    [loading, error, items, isEmpty, totalItems, cartTotal, subtotal, totalSavings, fetchCart, addItem, updateItemQuantity, removeItem, emptyCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
