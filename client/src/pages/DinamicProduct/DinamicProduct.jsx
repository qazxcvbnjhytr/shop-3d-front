// client/src/pages/DinamicProduct/DinamicProduct.jsx
import React, { useContext, useState, useEffect, useMemo } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../../context/CartContext.jsx";

import { LanguageContext } from "../../context/LanguageContext";
import { useBreadcrumbs } from "../../hooks/useBreadcrumbs";
import { useCategories } from "../../hooks/useCategories";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import LikesComponent from "../../components/Likes/LikesComponent";
import DiscountBadge from "../../components/DiscountBadge/DiscountBadge";

import { matchesProductQuery } from "../../utils/productSearch";

import "./DinamicProduct.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ITEMS_PER_PAGE = 9;

/* ---------- rating helpers ---------- */
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// ✅ тільки summary (НЕ рахуємо avg з items, бо limit=1)
function normalizeReviewSummary(raw) {
  const count =
    toNum(raw?.count) ||
    toNum(raw?.total) ||
    toNum(raw?.totalCount) ||
    toNum(raw?.totalReviews) ||
    0;

  const avgRating =
    toNum(raw?.avgRating) ||
    toNum(raw?.averageRating) ||
    toNum(raw?.avg) ||
    0;

  return { count, avgRating };
}

/* ⭐ stars mini-component */
function Stars({ value = 0 }) {
  const v = Math.round(toNum(value));
  return (
    <span className="dp-stars" aria-label={`Rating: ${v} / 5`}>
      {"★★★★★".split("").map((s, i) => (
        <span
          key={i}
          className={i < v ? "dp-star dp-star--filled" : "dp-star dp-star--empty"}
        >
          {s}
        </span>
      ))}
    </span>
  );
}

export default function CatalogCategory() {
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const navigate = useNavigate();
  const { addItem } = useCart();

  const { language, loading: langLoading } = useContext(LanguageContext);
  const { categoriesMap, loading: categoriesLoading } = useCategories();
  const { setData } = useBreadcrumbs();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * ratingsCache:
   * {
   *   [productId]: { avgRating: number, count: number }
   * }
   */
  const [ratingsCache, setRatingsCache] = useState({});

  /* =========================
     CATEGORY NAME (FROM DB)
  ========================= */
  const categoryName = useMemo(() => {
    const item = categoriesMap?.[category];
    return item?.[language] || item?.ua || category;
  }, [category, language, categoriesMap]);

  /* =========================
     BREADCRUMBS
  ========================= */
  useEffect(() => {
    setData?.((prev) => ({
      ...(prev || {}),
      categoryCode: category,
      productName: null,
    }));
  }, [category, setData]);

  /* =========================
     FETCH PRODUCTS
  ========================= */
  useEffect(() => {
    if (!category) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/products`, { params: { category } });
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Products load error:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    setCurrentPage(1);
  }, [category]);

  /* =========================
     FILTER (q from URL)
  ========================= */
  const filteredProducts = useMemo(() => {
    return products.filter((p) => matchesProductQuery(p, q, language));
  }, [products, q, language]);

  useEffect(() => setCurrentPage(1), [q]);

  /* =========================
     PAGINATION (filtered)
  ========================= */
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const currentItems = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const paginate = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /* =========================
     BUY HANDLER (add to cart + go to /cart)
  ========================= */
  const handleBuy = (item, productName, currentPrice, oldPrice) => {
    const id = String(item?._id || item?.id || "");
    if (!id) return;

    const imageAbs = item?.image ? `${API_URL}${item.image}` : "/placeholder.png";

    addItem(
      {
        id,
        name: productName || "Товар",
        price: Number(currentPrice) || 0, // ✅ ціна в кошику (вже з урахуванням знижки)
        oldPrice: Number(oldPrice) || 0,  // ✅ щоб у кошику показати перекреслену ціну
        discount: Number(item?.discount) || 0,
        image: imageAbs,
        category: String(item?.category || category || ""),
      },
      1
    );

    navigate("/shopping-cart");
  };

  /* =========================
     LOAD RATINGS FOR CURRENT PAGE (cached)
     ✅ Тягнемо ТІЛЬКИ summary (avgRating + count) з бекенда
  ========================= */
  useEffect(() => {
    let alive = true;

    const ids = currentItems.map((p) => p?._id).filter(Boolean);
    const missing = ids.filter((id) => ratingsCache[id] == null);
    if (!missing.length) return;

    const fetchOne = async (id) => {
      try {
        const r = await axios.get(`${API_URL}/api/reviews/product/${id}`, {
          params: { page: 1, limit: 1, _ts: Date.now() }, // ✅ ламає 304
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        const s = normalizeReviewSummary(r.data);
        return { id, avgRating: s.avgRating, count: s.count };
      } catch {
        return { id, avgRating: 0, count: 0 };
      }
    };

    (async () => {
      const results = await Promise.all(missing.map(fetchOne));
      if (!alive) return;

      setRatingsCache((prev) => {
        const next = { ...prev };
        results.forEach((x) => {
          next[x.id] = { avgRating: x.avgRating, count: x.count };
        });
        return next;
      });
    })();

    return () => {
      alive = false;
    };
  }, [currentItems, ratingsCache]);

  /* =========================
     LOADERS
  ========================= */
  if (loading || langLoading || categoriesLoading) {
    return (
      <div className="loader-container">
        <div className="loader" />
      </div>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="category-page-container">
      <header className="category-header">
        <h1 className="category-title">
          <span className="title-accent">/ </span>
          {categoryName}
        </h1>
      </header>

      <div className="catalog-grid">
        {currentItems.length ? (
          currentItems.map((item) => {
            const hasDiscount = toNum(item.discount) > 0;
            const oldPrice = toNum(item.price);
            const currentPrice = hasDiscount
              ? Math.round(oldPrice - (oldPrice * toNum(item.discount)) / 100)
              : oldPrice;

            const productName =
              item.name?.[language] || item.name?.ua || item.name?.en || "Назва товару";

            const cached = ratingsCache?.[item._id];
            const count = toNum(cached?.count);
            const rating = toNum(cached?.avgRating);

            return (
              <div key={item._id} className="catalog-card">
                <div className="card-actions-top">
                  <LikesComponent product={item} />
                </div>

                {hasDiscount && (
                  <div className="card-badge-wrapper">
                    <DiscountBadge discount={item.discount} />
                  </div>
                )}

                <Link to={`/catalog/${category}/${item._id}`} className="card-image-link">
                  <div className="image-wrapper">
                    <img
                      src={item.image ? `${API_URL}${item.image}` : "/placeholder.png"}
                      alt={productName}
                      className="card-image"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.png";
                      }}
                    />
                  </div>
                </Link>

                <div className="card-content">
                  <h3 className="card-title">{productName}</h3>

                  {/* ⭐ Rating row */}
                  <div
                    className="dp-rating"
                    title={count ? `Rating ${rating.toFixed(1)} (${count})` : "No reviews"}
                  >
                    <Stars value={count ? rating : 0} />

                    {count > 0 ? (
                      <span className="dp-rating__meta">
                        <span className="dp-rating__num">{rating.toFixed(1)}</span>
                        <span className="dp-rating__count">({count})</span>
                      </span>
                    ) : (
                      <span className="dp-rating__empty">(0)</span>
                    )}
                  </div>

                  <div className="price-block">
                    {hasDiscount && <span className="price-old">{oldPrice} грн</span>}
                    <span className="price-current">{currentPrice} грн</span>
                  </div>

                  {/* ✅ BUY BUTTON */}
                  <button
                    type="button"
                    className="dp-buy-btn"
                    onClick={() => handleBuy(item, productName, currentPrice, oldPrice)}
                  >
                    Купити
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <p>
              {q
                ? language === "ua"
                  ? "Нічого не знайдено за запитом."
                  : "Nothing found for your query."
                : language === "ua"
                ? "В цій категорії поки немає товарів."
                : "No products in this category yet."}
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)}>
            <FaChevronLeft />
          </button>

          <span>
            {currentPage} / {totalPages}
          </span>

          <button disabled={currentPage === totalPages} onClick={() => paginate(currentPage + 1)}>
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
