// client/src/pages/ProductPage/ProductPage.jsx
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { LanguageContext } from "@context/LanguageContext";
import { AuthContext } from "@context/AuthContext";

import { FaArrowLeft, FaCube } from "react-icons/fa";

// Blocks
import DescriptionTab from "./DescriptionTab/DescriptionTab.jsx";
import DeliveryTab from "./DeliveryTab/DeliveryTab.jsx";
import MiniGallery from "./MiniGallery/MiniGallery.jsx";
import ProductReviews from "./ProductReviews/ProductReviews.jsx";

// Components
import ModelViewer from "../../components/ModelViewer.jsx";
import LikesComponent from "../../components/Likes/LikesComponent.jsx";

// Styles
import "./ProductPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const pickText = (value, language) => {
  // language може бути: "ua" | "uk" | "en"
  const lang = language === "uk" ? "ua" : language;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") return value?.[lang] || value?.ua || value?.uk || value?.en || "";
  return "";
};

const toNumberOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const joinUrl = (base, raw) => {
  if (!raw || typeof raw !== "string") return "";
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("/")) return `${base}${raw}`;
  return `${base}/${raw}`.replace(/\/{2,}/g, "/").replace(":/", "://");
};

const isModelFile = (url) => {
  const clean = String(url || "").split("?")[0];
  return /\.(glb|gltf|usdz)$/i.test(clean);
};

export default function ProductPage() {
  const navigate = useNavigate();
  const params = useParams();

  // підтримка різних назв param в роуті
  const productId = params.id || params.productId || params._id;

  const { language, translations, loading: langLoading } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);

  // ✅ так само, як у HeaderTop
  const texts = translations?.productPage || {};

  const tr = useCallback(
    (key, fallback) => {
      const v = texts?.[key];
      return typeof v === "string" && v.trim() ? v : fallback;
    },
    [texts]
  );

  const token = localStorage.getItem("token") || "";

  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("description"); // description | reviews | delivery
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ 3D модалка відкривається тільки по кнопці
  const [viewerOpen, setViewerOpen] = useState(false);

  const onBack = useCallback(() => navigate(-1), [navigate]);

  // --- Fetch product ---
// --- Fetch product ---
useEffect(() => {
  let alive = true;

  const load = async () => {
    if (!productId) {
      if (!alive) return;
      setError("Product id is missing.");
      setLoading(false);
      return;
    }

    if (!alive) return;
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_URL}/api/products/${productId}`);
      if (!alive) return;
      setProduct(res.data);
    } catch (e) {
      if (!alive) return;
      setProduct(null);
      setError(e?.response?.data?.message || e?.message || "Failed to load product.");
    } finally {
      // ✅ без return у finally
      if (alive) setLoading(false);
    }
  };

  load();

  return () => {
    alive = false;
  };
}, [productId]);

  // ✅ name може бути {ua,en}
  const name = useMemo(() => {
    if (!product) return "";
    return (
      pickText(product?.name, language) ||
      String(product?.name_ua || "") ||
      String(product?.name_en || "") ||
      String(product?.title || "") ||
      "—"
    );
  }, [product, language]);

  // ✅ price/discount можуть бути в root або в specifications
  const price = useMemo(() => {
    if (!product) return null;
    return toNumberOrNull(product?.price) ?? toNumberOrNull(product?.specifications?.price) ?? null;
  }, [product]);

  const discount = useMemo(() => {
    if (!product) return 0;
    const d = toNumberOrNull(product?.discount) ?? toNumberOrNull(product?.specifications?.discount) ?? 0;
    return Number.isFinite(d) ? d : 0;
  }, [product]);

  const newPrice = useMemo(() => {
    if (price === null) return null;
    if (!discount) return price;
    return Math.round(price * (1 - discount / 100));
  }, [price, discount]);

  // ✅ 3D URL — тільки якщо це реально модель (glb/gltf/usdz)
  const modelUrl = useMemo(() => {
    if (!product) return "";
    const raw = product?.modelUrl || "";
    const abs = raw ? joinUrl(API_URL, raw) : "";
    return abs && isModelFile(abs) ? abs : "";
  }, [product]);

  // ✅ Продукт для лайків: LikesComponent очікує prop "product"
  const likeProduct = useMemo(() => {
    if (!product) return null;

    const img =
      product?.image ||
      product?.imageUrl ||
      (Array.isArray(product?.images) ? product.images[0] : "") ||
      product?.productImage ||
      "";

    return {
      ...product,
      image: img,
      discount,
      price,
      category: product?.category,
    };
  }, [product, discount, price]);

  // --- UI states ---
  if (langLoading) return null;

  if (loading) {
    return (
      <div className="product-page">
        <div className="product-page__state">
          {tr("loading", language === "en" ? "Loading..." : "Завантаження...")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-page">
        <div className="product-page__state product-page__state--error">{error}</div>
        <button className="product-page__back" onClick={onBack} type="button">
          <FaArrowLeft /> {tr("back", language === "en" ? "Back" : "Назад")}
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-page">
        <div className="product-page__state">
          {tr("notFound", language === "en" ? "Product not found" : "Товар не знайдено")}
        </div>
        <button className="product-page__back" onClick={onBack} type="button">
          <FaArrowLeft /> {tr("back", language === "en" ? "Back" : "Назад")}
        </button>
      </div>
    );
  }

  return (
    <div className="product-page">
      {/* Top bar */}
      <div className="product-page__top">
        <button className="product-page__back" onClick={onBack} type="button">
          <FaArrowLeft /> {tr("back", language === "en" ? "Back" : "Назад")}
        </button>

        <div className="product-page__like">
          {likeProduct ? <LikesComponent product={likeProduct} /> : null}
        </div>
      </div>

      {/* Two колонki як на прикладі: зліва фото, справа ціна/назва */}
      <div className="product-page__hero">
        <div className="product-page__heroLeft">
          {/* велике фото (всередині MiniGallery ти вже робиш thumbnails) */}
          <MiniGallery product={product} />
        </div>

        <div className="product-page__heroRight">
          <h1 className="product-page__title">{name}</h1>

          <div className="product-page__priceRow">
            {discount > 0 && price !== null ? (
              <span className="product-page__oldPrice">{price.toLocaleString("uk-UA")} грн</span>
            ) : null}

            <span className="product-page__newPrice">
              {newPrice !== null ? `${newPrice.toLocaleString("uk-UA")} грн` : "—"}
            </span>

            {discount > 0 ? <span className="product-page__discountBadge">-{discount}%</span> : null}
          </div>

          {/* 3D Viewer (кнопка + модалка) */}
          {modelUrl ? (
            <div className="product-page__viewer">
              <div className="product-page__viewerTitle">
                <FaCube /> {tr("view3D", language === "en" ? "View in 3D" : "Перегляд 3D")}
              </div>

              <button
                type="button"
                className="product-page__open3d"
                onClick={() => setViewerOpen(true)}
              >
                {tr("view3D", language === "en" ? "View in 3D" : "Перегляд 3D")}
              </button>

              {viewerOpen && <ModelViewer modelUrl={modelUrl} onClose={() => setViewerOpen(false)} />}
            </div>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className="product-page__tabs">
        <button
          className={`product-page__tab ${activeTab === "description" ? "is-active" : ""}`}
          onClick={() => setActiveTab("description")}
          type="button"
        >
          {tr("descriptionTab", language === "en" ? "Description" : "Опис")}
        </button>

        <button
          className={`product-page__tab ${activeTab === "reviews" ? "is-active" : ""}`}
          onClick={() => setActiveTab("reviews")}
          type="button"
        >
          {tr("reviewsTab", language === "en" ? "Reviews" : "Відгуки")}
        </button>

        <button
          className={`product-page__tab ${activeTab === "delivery" ? "is-active" : ""}`}
          onClick={() => setActiveTab("delivery")}
          type="button"
        >
          {tr("deliveryTab", language === "en" ? "Delivery" : "Доставка")}
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === "description" && <DescriptionTab product={product} language={language} />}

        {activeTab === "reviews" && (
          <ProductReviews
            productId={product?._id}
            token={token}
            userId={user?._id}
            userName={user?.name || user?.email || ""}
            language={language}
          />
        )}

        {activeTab === "delivery" && <DeliveryTab product={product} language={language} />}
      </div>
    </div>
  );
}
