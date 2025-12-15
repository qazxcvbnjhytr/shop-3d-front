import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { LikesContext } from "./likes.context";
import { useAuth } from "./AuthContext";

export default function LikesProvider({ children }) {
  const { user } = useAuth();
  const token = user?.token || localStorage.getItem("token");

  const [likedProducts, setLikedProducts] = useState([]);
  const [likedProductIds, setLikedProductIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = "http://localhost:5000/api/likes";

  const syncState = (products) => {
    const arr = Array.isArray(products) ? products : [];
    console.log("[LikesContext] Syncing state with:", arr);

    setLikedProducts(arr);
    setLikedProductIds(arr.map((p) => String(p.productId || p._id || p.id)));
  };

  const loadLikes = useCallback(async () => {
    if (!token) {
      console.log("[LikesContext] No token found, skipping load.");
      syncState([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log("[LikesContext] Fetching likes...");
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // якщо бек віддає { likes: [...] } або просто [...]
      syncState(res.data?.likes || res.data);
    } catch (err) {
      console.error("[LikesContext] GET Error:", err.response?.data || err.message);
      syncState([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadLikes();
  }, [loadLikes]);

  const isLiked = (id) => likedProductIds.includes(String(id));

  const toggleLike = async (product) => {
    if (!token) {
      alert("Увійдіть у систему!");
      return;
    }

    const productId = String(product?.productId || product?._id || product?.id || "");
    if (!productId) return;

    setIsLoading(true);

    try {
      // ✅ нормалізація полів (бо в тебе часто name_ua/name_en, images[])
      const productData = {
        productId,
        productName: product?.name || product?.name_ua || product?.name_en || product?.title || "",
        productCategory: product?.category || "",
        productImage: product?.image || product?.imageUrl || product?.images?.[0] || "",
        discount: Number(product?.discount || 0),
      };

      const res = await axios.post(API_URL, productData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      syncState(res.data?.likes || res.data);
    } catch (err) {
      console.error("[LikesContext] TOGGLE Error:", err.response?.data || err.message);
      alert("Помилка оновлення лайків. Дивись консоль.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LikesContext.Provider value={{ likedProducts, likedProductIds, toggleLike, isLiked, isLoading }}>
      {children}
    </LikesContext.Provider>
  );
}
