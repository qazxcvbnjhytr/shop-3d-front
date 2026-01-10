// client/src/context/LikesContext.jsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "./AuthContext";

export const LikesContext = createContext({
  likedProducts: [],
  likedProductIds: [],
  toggleLike: async () => {},
  isLiked: () => false,
  getLikeByProductId: () => null,
  isLoading: false,
  reloadLikes: async () => {},
});

const extractId = (v) => {
  if (!v) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    if (v.$oid) return String(v.$oid);
    if (v._id) return extractId(v._id);
    if (v.id) return extractId(v.id);
    if (v.productId) return extractId(v.productId);
    if (v.product?._id) return extractId(v.product._id);
  }
  return "";
};

const extractProductId = (like) => {
  if (!like) return "";
  if (typeof like === "string" || typeof like === "number") return String(like);
  if (typeof like === "object") {
    if (like.productId) return String(like.productId);
    if (like.product?._id) return extractId(like.product._id);
  }
  return "";
};

const normalizeLikes = (data) => {
  // підтримуємо різні формати бекенду
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.likes)) return data.likes;
  if (Array.isArray(data?.user?.likes)) return data.user.likes;
  return [];
};

const pickText = (value, lang = "ua") => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") return String(value?.[lang] ?? value?.ua ?? value?.uk ?? value?.en ?? "");
  return "";
};

const pickName = (p) => {
  if (!p) return "";
  if (typeof p.productName === "string") return p.productName;
  if (typeof p.name === "string") return p.name;
  const n1 = pickText(p.name, "ua") || pickText(p.name, "en");
  return n1 || p.title || "Товар";
};

const pickImage = (p) => {
  if (!p) return "";
  if (typeof p.productImage === "string" && p.productImage) return p.productImage;
  if (typeof p.image === "string" && p.image) return p.image;
  if (typeof p.imageUrl === "string" && p.imageUrl) return p.imageUrl;
  if (Array.isArray(p.images) && typeof p.images[0] === "string") return p.images[0];
  return "";
};

export default function LikesProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [likedProducts, setLikedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const likedProductIds = useMemo(
    () => (likedProducts || []).map(extractProductId).filter(Boolean),
    [likedProducts]
  );

  const isLiked = useCallback(
    (productId) => likedProductIds.includes(String(productId)),
    [likedProductIds]
  );

  const getLikeByProductId = useCallback(
    (productId) => {
      const pid = String(productId || "");
      if (!pid) return null;
      return (likedProducts || []).find((x) => extractProductId(x) === pid) || null;
    },
    [likedProducts]
  );

  const reloadLikes = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      setLikedProducts([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/likes");
      setLikedProducts(normalizeLikes(res.data));
    } catch (err) {
      console.error("[Likes] GET /likes error:", err.response?.data || err.message);
      setLikedProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    reloadLikes();
  }, [reloadLikes]);

  const toggleLike = useCallback(
    async (product) => {
      if (authLoading) return;

      if (!user) {
        alert("Увійдіть у систему!");
        return;
      }

      const productId = extractId(product?._id || product?.id || product?.productId || product);
      if (!productId) return;

      const pid = String(productId);

      // optimistic UI
      setLikedProducts((prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        const exists = arr.some((x) => extractProductId(x) === pid);
        if (exists) return arr.filter((x) => extractProductId(x) !== pid);

        const optimistic = {
          productId: pid,
          productName: pickName(product),
          productCategory: String(product?.category || product?.productCategory || ""),
          productImage: pickImage(product),
          discount: Number(product?.discount || 0),
          price: Number(product?.price || 0),
        };

        return [optimistic, ...arr];
      });

      setIsLoading(true);
      try {
        // бек у тебе очікує payload з productId (а інші поля — опціонально)
        const payload = {
          productId: pid,
          productName: pickName(product),
          productCategory: String(product?.category || product?.productCategory || ""),
          productImage: pickImage(product),
          discount: Number(product?.discount || 0),
          price: Number(product?.price || 0),
        };

        const res = await axiosInstance.post("/likes", payload);
        setLikedProducts(normalizeLikes(res.data));
      } catch (err) {
        console.error("[Likes] POST /likes error:", err.response?.data || err.message);
        // rollback: перечитати з сервера як truth
        await reloadLikes();
      } finally {
        setIsLoading(false);
      }
    },
    [user, authLoading, reloadLikes]
  );

  return (
    <LikesContext.Provider
      value={{
        likedProducts,
        likedProductIds,
        toggleLike,
        isLiked,
        getLikeByProductId,
        isLoading,
        reloadLikes,
      }}
    >
      {children}
    </LikesContext.Provider>
  );
}

export const useLikes = () => useContext(LikesContext);
