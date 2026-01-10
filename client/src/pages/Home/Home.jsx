import React, { useEffect, useMemo, useState, useContext } from "react";
import { LanguageContext } from "../../context/LanguageContext";

import DynamicCatalogDropdown from "../../components/DCD/DynamicCatalogDropdown";
import HowItWorks from "./HowItWorks/HowItWorks";
import HomeHero from "./HomeHero/HomeHero";
import PopularCategories from "./PopularCategories/PopularCategories";
import ProductTabs from "./ProductTabs/ProductTabs";
import TrustBar from "./TrustBar/TrustBar";

import { pickText } from "../../utils/pickText";
import "./Home.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getImg = (p) => {
  const raw = p?.image || p?.imageUrl || p?.mainImage || p?.images?.[0] || p?.photos?.[0] || "";
  if (!raw || typeof raw !== "string") return "";
  if (raw.startsWith("http")) return raw;
  return `${API_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

export default function Home() {
  const { language, translations } = useContext(LanguageContext);
  const lang = language || "ua";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // <--- ДИНАМІЧНІ КАТЕГОРІЇ
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [tab, setTab] = useState("hits");

  // 1. Фетчимо і Товари, і Категорії
  useEffect(() => {
    let alive = true;

    const fetchData = async () => {
      try {
        setLoadingProducts(true);
        
        // Паралельний запит для швидкості
        const [resProd, resCat] = await Promise.all([
          fetch(`${API_URL}/api/products`),
          fetch(`${API_URL}/api/categories`)
        ]);

        const dataProd = await resProd.json();
        const dataCat = await resCat.json();

        if (alive) {
          // Обробка товарів
          setProducts(Array.isArray(dataProd) ? dataProd : dataProd?.products || []);
          
          // Обробка категорій (сортуємо за order, якщо є)
          if (Array.isArray(dataCat)) {
            setCategories(dataCat.sort((a, b) => (a.order || 0) - (b.order || 0)));
          }
        }
      } catch (err) {
        console.error("Data fetch error:", err);
      } finally {
        if (alive) setLoadingProducts(false);
      }
    };

    fetchData();

    return () => { alive = false; };
  }, []);

  // --- Сортування товарів (без змін) ---
  const hits = useMemo(() => {
    return [...products]
      .sort((a, b) => Number(b?.views || 0) - Number(a?.views || 0))
      .slice(0, 8);
  }, [products]);

  const discounts = useMemo(() => {
    return products
      .filter((p) => Number(p?.discount || 0) > 0)
      .sort((a, b) => Number(b?.discount || 0) - Number(a?.discount || 0))
      .slice(0, 8);
  }, [products]);

  const newest = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      .slice(0, 8);
  }, [products]);

  const activeList = tab === "discounts" ? discounts : tab === "new" ? newest : hits;

  // Беремо перші 6 категорій для блоку "Популярні"
  const popularCategoriesList = categories.slice(0, 6);

  return (
    <div className="home-page">
      <div className="home-top">
        <aside className="home-sidebar">
          <DynamicCatalogDropdown />
        </aside>

        <main className="home-content">
          <HomeHero />

          {/* Передаємо живі дані з картинками */}
          <PopularCategories items={popularCategoriesList} />

          <ProductTabs
            tab={tab}
            setTab={setTab}
            loading={loadingProducts}
            products={activeList}
            lang={lang}
            getImg={getImg}
            pickText={pickText}
            translations={translations}
          />

          <TrustBar />
        </main>
      </div>

      <HowItWorks />
    </div>
  );
}