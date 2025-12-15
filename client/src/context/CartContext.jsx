import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext"; // якщо в тебе інший експорт — скажеш, підправлю

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const STORAGE_KEY = "shop3d_cart_v1";

const CartContext = createContext(null);

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizeLocalItem = (raw) => {
  const id = String(raw?.id || raw?._id || raw?.productId || "");
  return {
    id,
    name: String(raw?.name || "Товар"),
    price: toNum(raw?.price),
    oldPrice: toNum(raw?.oldPrice || 0),
    discount: toNum(raw?.discount || 0),
    image: typeof raw?.image === "string" ? raw.image : "",
    category: String(raw?.category || ""),
    quantity: Math.max(1, Math.floor(toNum(raw?.quantity || 1))),
  };
};

// з бекенда: { items: [{ product: {...}, qty }] }
const mapServerCartToItems = (cart) => {
  const arr = Array.isArray(cart?.items) ? cart.items : [];
  return arr
    .map((x) => {
      const p = x?.product;
      const id = String(p?._id || "");
      if (!id) return null;

      // image з БД може бути "/img/..." — під твій UI, якщо треба, будеш joinUrl робити в компоненті
      const price = toNum(p?.price);
      const discount = toNum(p?.discount);
      const newPrice = discount ? Math.round(price * (1 - discount / 100)) : price;

      return {
        id,
        name: typeof p?.name === "object" ? (p.name?.ua || p.name?.en || "Товар") : String(p?.name || "Товар"),
        price: newPrice,
        oldPrice: discount ? price : 0,
        discount,
        image: p?.image ? String(p.image) : "",
        category: String(p?.category || ""),
        quantity: Math.max(1, Math.floor(toNum(x?.qty || 1))),
      };
    })
    .filter(Boolean);
};

export function CartProvider({ children }) {
  const { user } = useAuth?.() || { user: null };
  const token = localStorage.getItem("token") || "";

  const [items, setItems] = useState([]);

  const isAuthed = Boolean(user && token);

  // -------- localStorage helpers (guest cart) --------
  const loadLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeLocalItem).filter((x) => x.id);
    } catch {
      return [];
    }
  }, []);

  const saveLocal = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  // -------- API helpers --------
  const api = useMemo(() => {
    return axios.create({
      baseURL: API_URL,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, [token]);

  // 1) On mount / auth change: load cart
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!isAuthed) {
        const local = loadLocal();
        if (alive) setItems(local);
        return;
      }

      // якщо юзер залогінився — можна залити guest-cart у DB
      const local = loadLocal();
      if (local.length) {
        try {
          // додаємо по одному (простий і надійний варіант)
          await Promise.all(
            local.map((it) =>
              api.post("/api/cart/add", { productId: it.id, qty: it.quantity })
            )
          );
          saveLocal([]); // очищаємо guest-cart після переносу
        } catch {
          // якщо не вийшло — не затираємо local
        }
      }

      try {
        const res = await api.get("/api/cart");
        const next = mapServerCartToItems(res.data);
        if (alive) setItems(next);
      } catch  {
        // якщо 401 — не чисти localStorage тут (важливо!)
        if (alive) setItems([]);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [isAuthed, api, loadLocal, saveLocal]);

  // 2) Persist guest cart on changes (тільки коли НЕ авторизований)
  useEffect(() => {
    if (!isAuthed) saveLocal(items);
  }, [items, isAuthed, saveLocal]);

  // -------- Public actions --------
  const addItem = useCallback(
    async (product, qty = 1) => {
      const productId = String(product?._id || product?.id || product?.productId || "");
      const q = Math.max(1, Math.floor(toNum(qty)));

      if (!productId) return;

      if (isAuthed) {
        const res = await api.post("/api/cart/add", { productId, qty: q });
        setItems(mapServerCartToItems(res.data));
        return;
      }

      setItems((prev) => {
        const base = normalizeLocalItem({ ...product, id: productId, quantity: q });
        const idx = prev.findIndex((x) => x.id === productId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + q };
          return next;
        }
        return [...prev, base];
      });
    },
    [isAuthed, api]
  );

  const updateItemQuantity = useCallback(
    async (productId, qty) => {
      const id = String(productId || "");
      const q = Math.max(1, Math.floor(toNum(qty)));
      if (!id) return;

      if (isAuthed) {
        const res = await api.put("/api/cart/qty", { productId: id, qty: q });
        setItems(mapServerCartToItems(res.data));
        return;
      }

      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, quantity: q } : x)));
    },
    [isAuthed, api]
  );

  const removeItem = useCallback(
    async (productId) => {
      const id = String(productId || "");
      if (!id) return;

      if (isAuthed) {
        const res = await api.delete(`/api/cart/item/${id}`);
        setItems(mapServerCartToItems(res.data));
        return;
      }

      setItems((prev) => prev.filter((x) => x.id !== id));
    },
    [isAuthed, api]
  );

  const emptyCart = useCallback(
    async () => {
      if (isAuthed) {
        await api.delete("/api/cart/clear");
        setItems([]);
        return;
      }
      setItems([]);
      saveLocal([]);
    },
    [isAuthed, api, saveLocal]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, x) => sum + Math.max(1, toNum(x.quantity)), 0),
    [items]
  );

  const cartTotal = useMemo(
    () => items.reduce((sum, x) => sum + toNum(x.price) * Math.max(1, toNum(x.quantity)), 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      isEmpty: items.length === 0,
      totalItems,
      cartTotal,
      addItem,
      updateItemQuantity,
      removeItem,
      emptyCart,
    }),
    [items, totalItems, cartTotal, addItem, updateItemQuantity, removeItem, emptyCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
