import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

export const LikesContext = createContext({
  likedProducts: [],
  likedProductIds: [],
  toggleLike: async () => {},
  isLiked: () => false,
  getLikeById: () => null,
  isLoading: false,
  reloadLikes: async () => {},
});

const RAW_API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const normalizeBase = (raw) => {
  const s = String(raw || "").replace(/\/+$/, "");
  return s.replace(/\/api\/?$/, "");
};

const BASE = normalizeBase(RAW_API);
const LIKES_URL = `${BASE}/api/likes`;

// Универсальный extractId (НЕ используем его для лайков напрямую)
const extractId = (v) => {
  if (!v) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);

  if (typeof v === "object") {
    if (v.$oid) return String(v.$oid);
    if (v._id) return extractId(v._id);
    if (v.id) return extractId(v.id);
    if (v.productId) return extractId(v.productId);
    if (v.product) return extractId(v.product);
  }
  return "";
};

// ✅ ВАЖНО: productId вытаскиваем СТРОГО (НЕ возвращаем like._id)
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

const pickName = (p) => {
  if (!p) return "";
  if (typeof p?.productName === "string") return p.productName;
  if (typeof p?.name === "string") return p.name;
  return p?.name_ua || p?.name_en || p?.title || "";
};

const normalizeLikesFromResponse = (data) => {
  const user = data?.user || data;
  if (Array.isArray(user?.likes)) return user.likes;
  if (Array.isArray(data?.likes)) return data.likes;
  if (Array.isArray(data)) return data;
  return [];
};

export const LikesProvider = ({ children }) => {
  const { user } = useAuth();
  const token = user?.token || localStorage.getItem("token") || "";

  const [likedProducts, setLikedProducts] = useState([]);
  const [likedProductIds, setLikedProductIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const headers = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const syncState = useCallback((likes) => {
    const arr = Array.isArray(likes) ? likes : [];
    setLikedProducts(arr);

    // ✅ ids только из productId
    const ids = arr.map(extractProductId).filter(Boolean);
    setLikedProductIds(ids);
  }, []);

  const loadLikes = useCallback(async () => {
    if (!token) {
      syncState([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.get(LIKES_URL, { headers });
      syncState(normalizeLikesFromResponse(res.data));
    } catch (err) {
      console.error("[LikesContext] GET Error:", err.response?.data || err.message);
      syncState([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, headers, syncState]);

  useEffect(() => {
    loadLikes();
  }, [loadLikes]);

  const isLiked = useCallback(
    (id) => likedProductIds.includes(String(id)),
    [likedProductIds]
  );

  const getLikeById = useCallback(
    (id) => {
      const pid = String(id || "");
      if (!pid) return null;
      return (likedProducts || []).find((x) => extractProductId(x) === pid) || null;
    },
    [likedProducts]
  );

  const toggleLike = useCallback(
    async (product) => {
      if (!token) {
        alert("Увійдіть у систему!");
        return;
      }

      const productId = extractId(product);
      if (!productId) return;

      setIsLoading(true);
      try {
        const productData = {
          productId,
          productName: pickName(product),
          productCategory: String(product?.category || product?.productCategory || ""),
          productImage:
            product?.productImage ||
            product?.image ||
            product?.imageUrl ||
            (Array.isArray(product?.images) ? product.images[0] : "") ||
            "",
          discount: Number(product?.discount || 0),
          price: Number(product?.price || 0),
        };

        const res = await axios.post(LIKES_URL, productData, { headers });
        syncState(normalizeLikesFromResponse(res.data));
      } catch (err) {
        console.error("[LikesContext] TOGGLE Error:", err.response?.data || err.message);
        alert("Помилка оновлення лайків. Дивись консоль.");
      } finally {
        setIsLoading(false);
      }
    },
    [token, headers, syncState]
  );

  return (
    <LikesContext.Provider
      value={{
        likedProducts,
        likedProductIds,
        toggleLike,
        isLiked,
        getLikeById,
        isLoading,
        reloadLikes: loadLikes,
      }}
    >
      {children}
    </LikesContext.Provider>
  );
};

export const useLikes = () => useContext(LikesContext);
