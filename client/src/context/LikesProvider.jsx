import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "./AuthContext";

export const LikesContext = createContext(null);

const extractId = (v) => {
  if (!v) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    if (v.$oid) return String(v.$oid);
    if (v._id) return extractId(v._id);
    if (v.id) return extractId(v.id);
  }
  return "";
};

const extractProductId = (like) => {
  if (!like) return "";
  if (typeof like === "string" || typeof like === "number") return String(like);
  if (typeof like === "object") {
    if (like.productId) return String(like.productId);
    if (like.product?._id) return extractId(like.product._id);
    if (like.product?.id) return extractId(like.product.id);
  }
  return "";
};

const normalizeLikes = (data) => {
  // підтримка різних форматів відповіді
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.likes)) return data.likes;
  if (Array.isArray(data?.user?.likes)) return data.user.likes;
  return [];
};

export default function LikesProvider({ children }) {
  const { user, loading } = useAuth();
  const [likedProducts, setLikedProducts] = useState([]);
  const likedProductIds = useMemo(
    () => likedProducts.map(extractProductId).filter(Boolean),
    [likedProducts]
  );

  const reloadLikes = useCallback(async () => {
    if (loading) return;
    if (!user) { setLikedProducts([]); return; }

    try {
      const res = await axiosInstance.get("/likes");
      setLikedProducts(normalizeLikes(res.data));
    } catch (e) {
      console.error("[Likes] load error:", e.response?.data || e.message);
      setLikedProducts([]);
    }
  }, [user, loading]);

  useEffect(() => { reloadLikes(); }, [reloadLikes]);

  const isLiked = useCallback((productId) => likedProductIds.includes(String(productId)), [likedProductIds]);

  const toggleLike = useCallback(async (product) => {
    if (loading) return;
    if (!user) { alert("Увійдіть у систему!"); return; }

    const productId = extractId(product?._id || product?.id || product?.productId || product);
    if (!productId) return;

    // optimistic
    setLikedProducts((prev) => {
      const pid = String(productId);
      const exists = prev.some((x) => extractProductId(x) === pid);
      if (exists) return prev.filter((x) => extractProductId(x) !== pid);
      return [{ productId: pid }, ...prev];
    });

    try {
      const res = await axiosInstance.post("/likes", { productId });
      setLikedProducts(normalizeLikes(res.data));
    } catch (e) {
      console.error("[Likes] toggle error:", e.response?.data || e.message);
      // rollback: просто перечитати з сервера як source of truth
      await reloadLikes();
    }
  }, [user, loading, reloadLikes]);

  return (
    <LikesContext.Provider value={{ likedProducts, likedProductIds, isLiked, toggleLike, reloadLikes }}>
      {children}
    </LikesContext.Provider>
  );
}

export const useLikes = () => useContext(LikesContext);
