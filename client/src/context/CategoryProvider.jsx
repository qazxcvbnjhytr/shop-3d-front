import React, { useEffect, useState } from "react";
import axios from "axios";
import { CategoryContext } from "./CategoryContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function CategoryProvider({ children }) {
  const [categoriesMap, setCategoriesMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/categories`);

        const map = {};
        res.data.forEach(cat => {
          map[cat.category] = cat.names;
        });

        setCategoriesMap(map);
      } catch (err) {
        console.error("Categories load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <CategoryContext.Provider value={{ categoriesMap, loading }}>
      {children}
    </CategoryContext.Provider>
  );
}
