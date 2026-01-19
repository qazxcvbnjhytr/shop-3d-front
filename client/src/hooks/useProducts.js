import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";

const normalizeOrigin = (url) => String(url || "").replace(/\/+$/, "");
const normalizePrefix = (p) => {
  const s = String(p || "/api").trim();
  if (!s) return "/api";
  return s.startsWith("/") ? s.replace(/\/+$/, "") : `/${s.replace(/\/+$/, "")}`;
};

if (!API_URL) {
  throw new Error("Missing VITE_API_URL in client/.env(.local)");
}

const BASE = `${normalizeOrigin(API_URL)}${normalizePrefix(API_PREFIX)}`;
// ✅ products endpoint: `${BASE}/products`

export default function useProducts(params = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${BASE}/products`, {
        params: { ...params, _ts: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        timeout: 20000,
      });

      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("[useProducts] error:", e);
      const msg = e?.response?.data?.message || e?.message || "Failed to load products";
      setError(String(msg));
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
