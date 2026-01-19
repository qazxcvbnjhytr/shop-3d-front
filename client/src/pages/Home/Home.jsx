import React, { useEffect, useMemo, useState, useContext } from "react";
import { LanguageContext } from "../../context/LanguageContext";

import DynamicCatalogDropdown from "../../components/DCD/DynamicCatalogDropdown";
import HowItWorks from "./HowItWorks/HowItWorks";
import HomeHero from "./HomeHero/HomeHero";
import PopularCategories from "./PopularCategories/PopularCategories";
import ProductTabs from "./ProductTabs/ProductTabs";
import TrustBar from "./TrustBar/TrustBar";

import { pickText } from "../../utils/pickText";
import { getImageUrl } from "../../utils/imageUtils"; // ✅ централізовано для /uploads та абсолютних URL
import api from "../../api/api"; // ✅ env-first axios instance

import "./Home.css";

const normalizeProducts = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const normalizeCategories = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const getImg = (p) => {
  const raw =
    p?.image ||
    p?.imageUrl ||
    p?.mainImage ||
    (Array.isArray(p?.images) ? p.images[0] : "") ||
    (Array.isArray(p?.photos) ? p.photos[0] : "") ||
    "";
  return raw ? getImageUrl(raw) : "";
};

export default function Home() {
  const { language, translations } = useContext(LanguageContext);
  const lang = language || "ua";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // ✅ ДИНАМІЧНІ КАТЕГОРІЇ
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [tab, setTab] = useState("hits");

  // ✅ Фетчимо і Товари, і Категорії через api (env-first)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingProducts(true);

        const [resProd, resCat] = await Promise.all([
          api.get("/products"),
          api.get("/categories"),
        ]);

        if (!alive) return;

        const prods = normalizeProducts(resProd.data);
        const cats = normalizeCategories(resCat.data);

        setProducts(prods);

        // ✅ сортуємо за order, якщо є
        const sortedCats = [...cats].sort((a, b) => (a?.order || 0) - (b?.order || 0));
        setCategories(sortedCats);
      } catch (err) {
        console.error("Data fetch error:", err);
        if (alive) {
          setProducts([]);
          setCategories([]);
        }
      } finally {
        if (alive) setLoadingProducts(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // --- Сортування товарів ---
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

  // ✅ Беремо перші 6 категорій для блоку "Популярні"
  const popularCategoriesList = categories.slice(0, 6);

  return (
    <div className="home-page">
      <div className="home-top">
        <aside className="home-sidebar">
          <DynamicCatalogDropdown />
        </aside>

        <main className="home-content">
          <HomeHero />

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
