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
// ✅ locations endpoint: `${BASE}/locations`

export function useLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await axios.get(`${BASE}/locations`, { withCredentials: true });
      setLocations(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      setError(String(e?.response?.data?.message || e?.message || "Failed to load locations"));
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { locations, loading, error, reload: load };
}
