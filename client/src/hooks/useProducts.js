import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function useProducts(params = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_URL}/api/products`, {
        params: { ...params, _ts: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        timeout: 20000,
      });

      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("[useProducts] error:", e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load products";
      setError(msg);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  return { products, loading, error, reload: load };
}
