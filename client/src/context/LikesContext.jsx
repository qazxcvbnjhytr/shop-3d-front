import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

export const LikesContext = createContext({
  likedProducts: [],
  likedProductIds: [],
  toggleLike: async () => {},
  isLiked: () => false,
  isLoading: false,
});

export const LikesProvider = ({ children }) => {
  const { user } = useAuth();
  const token = user?.token || localStorage.getItem("token");

  const [likedProducts, setLikedProducts] = useState([]);
  const [likedProductIds, setLikedProductIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = "http://localhost:5000/api/likes";

  const syncState = useCallback((products) => {
    const arr = Array.isArray(products) ? products : [];
    setLikedProducts(arr);
    setLikedProductIds(arr.map((p) => String(p.productId)));
  }, []);

  const loadLikes = useCallback(async () => {
    if (!token) {
      syncState([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      syncState(res.data?.likes || res.data);
    } catch (err) {
      console.error("[LikesContext] GET Error:", err.response?.data || err.message);
      syncState([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, syncState]);

  useEffect(() => {
    loadLikes();
  }, [loadLikes]);

  const isLiked = useCallback(
    (id) => likedProductIds.includes(String(id)),
    [likedProductIds]
  );

  const toggleLike = useCallback(
    async (product) => {
      if (!token) {
        alert("Увійдіть у систему!");
        return;
      }

      const productId = String(product?.id || product?._id || product?.productId || "");
      if (!productId) return;

      setIsLoading(true);

      try {
        const productData = {
          productId,
          productName:
            product?.name ||
            product?.name_ua ||
            product?.name_en ||
            product?.title ||
            "",
          productCategory: product?.category || "",
          productImage:
            product?.image ||
            product?.imageUrl ||
            product?.images?.[0] ||
            "",
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
    },
    [token, syncState]
  );

  return (
    <LikesContext.Provider
      value={{ likedProducts, likedProductIds, toggleLike, isLiked, isLoading }}
    >
      {children}
    </LikesContext.Provider>
  );
};

export const useLikes = () => useContext(LikesContext);
