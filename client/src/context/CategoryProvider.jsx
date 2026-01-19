import React, { useEffect, useState } from "react";
import axios from "axios";
import { CategoryContext } from "./CategoryContext";

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
// ✅ categories endpoint: `${BASE}/categories`

export function CategoryProvider({ children }) {
  const [categoriesMap, setCategoriesMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${BASE}/categories`, {
          withCredentials: true, // якщо бек працює з cookies/credentials
        });

        const map = {};
        res.data.forEach((cat) => {
          map[cat.category] = cat.names;
        });

        if (alive) setCategoriesMap(map);
      } catch (err) {
        console.error("Categories load error:", err);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchCategories();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <CategoryContext.Provider value={{ categoriesMap, loading }}>
      {children}
    </CategoryContext.Provider>
  );
}
