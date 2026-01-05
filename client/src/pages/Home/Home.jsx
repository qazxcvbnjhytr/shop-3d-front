import React, { useEffect, useMemo, useState } from "react";

import DynamicCatalogDropdown from "../../components/DCD/DynamicCatalogDropdown";
import HowItWorks from "./HowItWorks/HowItWorks";

import HomeHero from "./HomeHero/HomeHero";
import PopularCategories from "./PopularCategories/PopularCategories";
import ProductTabs from "./ProductTabs/ProductTabs";
import TrustBar from "./TrustBar/TrustBar";

import { useTranslation } from "../../hooks/useTranslation";
import { normalizeLang, pickText } from "../../utils/pickText";

import "./Home.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getImg = (p) => {
  const raw =
    p?.image ||
    p?.imageUrl ||
    p?.mainImage ||
    p?.images?.[0] ||
    p?.photos?.[0] ||
    "";

  if (!raw || typeof raw !== "string") return "";
  if (raw.startsWith("http")) return raw;
  return `${API_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

export default function Home() {
  const { language } = useTranslation();
  const lang = normalizeLang(language);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [tab, setTab] = useState("hits"); // hits | discounts | new

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch(`${API_URL}/api/products`);
        const data = await res.json();

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];

        if (alive) setProducts(list);
      } catch {
        if (alive) setProducts([]);
      } finally {
        if (alive) setLoadingProducts(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const hits = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      const av = Number(a?.views || a?.sales || a?.likesCount || 0);
      const bv = Number(b?.views || b?.sales || b?.likesCount || 0);
      return bv - av;
    });
    return sorted.slice(0, 8);
  }, [products]);

  const discounts = useMemo(() => {
    return products
      .filter((p) => Number(p?.discount || 0) > 0)
      .sort((a, b) => Number(b?.discount || 0) - Number(a?.discount || 0))
      .slice(0, 8);
  }, [products]);

  const newest = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      const ad = new Date(a?.createdAt || 0).getTime();
      const bd = new Date(b?.createdAt || 0).getTime();
      return bd - ad;
    });
    return sorted.slice(0, 8);
  }, [products]);

  const activeList = tab === "discounts" ? discounts : tab === "new" ? newest : hits;

  const categoryTiles = [
    { key: "beds", label: "Ліжка" },
    { key: "chairs", label: "Стільці" },
    { key: "tables", label: "Столи" },
    { key: "wardrobes", label: "Шафи" },
    { key: "shelves", label: "Полички" },
    { key: "mirrors", label: "Дзеркала" },
  ];

  return (
    <div className="home-page">
      <div className="home-top">
        <aside className="home-sidebar">
          <DynamicCatalogDropdown />
        </aside>

        <main className="home-content">
          <HomeHero />

          <PopularCategories items={categoryTiles} />

          <ProductTabs
            tab={tab}
            setTab={setTab}
            loading={loadingProducts}
            products={activeList}
            lang={lang}
            getImg={getImg}
            pickText={pickText}
          />

          <TrustBar />
        </main>
      </div>

      <HowItWorks />
    </div>
  );
}
