import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaCube, FaTruck, FaShieldAlt, FaCheckCircle } from "react-icons/fa";

// Contexts
import { LanguageContext } from "@context/LanguageContext";
import { AuthContext } from "@context/AuthContext";

// ✅ Hook translations
import { useTranslation } from "../../hooks/useTranslation";

// ✅ Hook configs (spec templates/fields/dicts)
import { useSpecConfig } from "../../hooks/useSpecConfig";

// Helpers
import { pickText, toNumberOrNull, joinUrl } from "./productHelpers";

// Components
import BuyButton from "../DinamicProduct/BuyButton/BuyButton.jsx";
import RatingStars from "../DinamicProduct/RatingStars/RatingStars.jsx";
import Articule from "../DinamicProduct/Articule/Articule.jsx";
import MiniGallery from "./MiniGallery/MiniGallery.jsx";
import ProductReviews from "./ProductReviews/ProductReviews.jsx";
import Specifications from "./Specifications/Specifications.jsx";
import SpecificationsMini from "./SpecificationsMini/SpecificationsMini.jsx";
import DeliveryTab from "./DeliveryTab/DeliveryTab.jsx";
import Description from "./description/description.jsx";
import ModelViewer from "./ModelViewer/ModelViewer.jsx";
import LikesComponent from "../../components/Likes/LikesComponent.jsx";

import "./ProductPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ProductPage() {
  const navigate = useNavigate();
  const params = useParams();

  const { language } = useContext(LanguageContext);
  const { user } = useContext(AuthContext) || {}; // поки не використовуємо, але хай буде
  const { t } = useTranslation();

  const productId = params.id || params.productId || params._id || "";
  const categoryParam = params.category || "";
  const subCategoryParam = params.subCategory || "";
  const slugParam = params.slug || "";

  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("reviews");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [ratingState, setRatingState] = useState({ avgRating: 0, count: 0 });

  const txt = (key, fallback) => t?.productPage?.[key] || fallback;

  const onBack = () => navigate(-1);

  useEffect(() => {
    let alive = true;

    const fetchProduct = async () => {
      setLoading(true);
      setError("");

      try {
        let res;
        if (slugParam && categoryParam) {
          res = await axios.get(
            `${API_URL}/api/products/by-slug/${categoryParam}/${subCategoryParam}/${slugParam}`
          );
        } else {
          res = await axios.get(`${API_URL}/api/products/${productId}`);
        }

        if (!alive) return;

        setProduct(res.data);
        setRatingState({
          avgRating: toNumberOrNull(res.data?.ratingAvg) ?? 0,
          count: toNumberOrNull(res.data?.ratingCount) ?? 0,
        });
      } catch (e) {
        if (alive) setError(txt("notFound", "Товар не знайдено"));
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      alive = false;
    };
  }, [productId, slugParam, categoryParam, subCategoryParam, t]);

  const name = useMemo(() => pickText(product?.name, language), [product, language]);
  const sku = useMemo(() => String(product?.sku || "").trim(), [product]);

  const price = useMemo(() => toNumberOrNull(product?.price), [product]);
  const discount = useMemo(() => toNumberOrNull(product?.discount) ?? 0, [product]);
  const newPrice = useMemo(() => {
    if (!price) return null;
    const d = Math.max(0, Math.min(100, discount));
    return Math.round(price * (1 - d / 100));
  }, [price, discount]);

  const modelUrl = useMemo(() => {
    return product?.modelUrl ? joinUrl(API_URL, product.modelUrl) : "";
  }, [product]);

  const inStock = product?.inStock !== false;

  // ✅ Важливо: typeKey з product -> конфіги
  const typeKey = useMemo(() => {
    return String(product?.typeKey || "default").trim() || "default";
  }, [product]);

  // ✅ Підтягуємо template + fields + dictionaries
  const {
    template: specTemplate,
    fields: specFields,
    dictionaries,
    loading: specLoading,
    error: specError,
  } = useSpecConfig(typeKey);

  const collectionLabels = useMemo(() => {
    const keys = Array.isArray(product?.collectionKeys) ? product.collectionKeys : [];
    return keys.map((k) => t?.collections?.[k] || k);
  }, [product, t]);

  if (loading) return <div className="pp-loading">{txt("loading", "Завантаження...")}</div>;
  if (!product) return <div className="pp-error">{error || txt("notFound", "Товар не знайдено")}</div>;

  return (
    <div className="product-page">
      <nav className="pp-nav">
        <button className="pp-back-btn" onClick={onBack}>
          <FaArrowLeft /> <span>{txt("back", "Назад")}</span>
        </button>

        <div className="pp-likes-wrapper">
          <LikesComponent product={product} />
        </div>
      </nav>

      <div className="pp-grid">
        {/* Gallery */}
        <div className="pp-gallery-col">
          <div className="pp-gallery-sticky">
            <MiniGallery product={product} />
          </div>
        </div>

        {/* Info & Buy */}
        <div className="pp-info-col">
          <header className="pp-header">
            <div className="pp-status-row">
              {inStock ? (
                <span className="status-badge instock">
                  <FaCheckCircle /> {txt("inStock", "В наявності")}
                </span>
              ) : (
                <span className="status-badge outstock">{txt("outOfStock", "Немає в наявності")}</span>
              )}
              <Articule value={sku} />
            </div>

            <h1 className="pp-title">{name}</h1>

            <div className="pp-rating-row">
              <RatingStars value={ratingState.avgRating} count={ratingState.count} />
              <button className="pp-reviews-link" onClick={() => setActiveTab("reviews")}>
                {ratingState.count} {txt("reviewsCount", "відгуків")}
              </button>
            </div>

            {collectionLabels.length > 0 && (
              <div className="pp-collection-row">
                <strong>{txt("collection", "Колекція")}:</strong> {collectionLabels.join(", ")}
              </div>
            )}
          </header>

          <div className="pp-action-card">
            <div className="pp-price-block">
              {discount > 0 && price != null && <span className="pp-old-price">{price.toLocaleString()} ₴</span>}

              <div className="pp-current-price">
                {newPrice != null ? newPrice.toLocaleString() : "—"} <span className="currency">₴</span>
              </div>

              {discount > 0 && <span className="pp-discount-tag">{txt("discount", "Знижка")} -{discount}%</span>}
            </div>

            <div className="pp-buttons-stack">
              <BuyButton item={product} className="pp-main-cta" />

              {modelUrl && (
                <button className="pp-3d-btn" onClick={() => setViewerOpen(true)}>
                  <FaCube className="icon-3d" />
                  <span>{txt("view3D", "Подивитись у 3D")}</span>
                </button>
              )}
            </div>

            <div className="pp-trust-badges">
              <div className="trust-item">
                <FaTruck /> <span>{txt("fastDelivery", "Швидка доставка")}</span>
              </div>
              <div className="trust-item">
                <FaShieldAlt /> <span>{txt("warranty", "Гарантія якості")}</span>
              </div>
            </div>
          </div>

          <div className="pp-specs-preview">
            <SpecificationsMini product={product} language={language} t={t} />

            {product.colorKeys?.length > 0 && (
              <div className="pp-color-picker">
                <span className="label">{txt("color", "Колір")}:</span>
                <div className="color-dots">
                  {product.colorKeys.map((c) => (
                    <div
                      key={c}
                      className="color-dot active"
                      title={t?.colors?.[c] || c}
                      style={{
                        background:
                          c === "red" ? "#e74c3c" : c === "dark_gray" ? "#444" : "#555",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pp-desc-short">
            <Description product={product} language={language} isPreview={true} />
          </div>
        </div>
      </div>

      <div className="pp-tabs-section">
        <div className="pp-tabs-header">
          {["reviews", "delivery", "specs"].map((tab) => (
            <button
              key={tab}
              className={`pp-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {txt(`${tab}Tab`, tab)}
            </button>
          ))}
        </div>

        <div className="pp-tab-content">
        {activeTab === "reviews" && (
  <ProductReviews
    productId={product._id}
    token={localStorage.getItem("token") || ""}
    onStatsChange={setRatingState}
  />
)}

          {activeTab === "delivery" && <DeliveryTab product={product} language={language} />}

          {activeTab === "specs" && (
            <>
              {!!specError && (
                <div className="specs-empty">
                  {language === "en"
                    ? `Config load error: ${specError}`
                    : `Помилка завантаження конфігу: ${specError}`}
                </div>
              )}

              <Specifications
                product={product}
                language={language}
                t={t}
                specTemplate={specTemplate}
                specFields={specFields}
                dictionaries={dictionaries}
                loading={specLoading}
              />
            </>
          )}
        </div>
      </div>

      {viewerOpen && <ModelViewer modelUrl={modelUrl} onClose={() => setViewerOpen(false)} />}
    </div>
  );
}
