// client/src/pages/ProductPage/ProductReviews/ProductReviews.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import "./ProductReviews.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const calcAvg = (items = []) => {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return 0;
  const sum = arr.reduce((acc, r) => acc + toNum(r?.rating), 0);
  return Math.round((sum / arr.length) * 10) / 10;
};

function Stars({ value = 0 }) {
  const v = Math.round(toNum(value));
  return (
    <span className="stars-rating" aria-label={`Рейтинг: ${v} з 5`}>
      {"★★★★★".split("").map((s, i) => (
        <span key={i} className={i < v ? "star-filled" : "star-empty"}>
          {s}
        </span>
      ))}
    </span>
  );
}

function normalizeReviewsResponse(raw) {
  const items = raw?.items || raw?.reviews || raw?.data || [];
  const safeItems = Array.isArray(items) ? items : [];

  const count =
    toNum(raw?.count) ||
    toNum(raw?.total) ||
    toNum(raw?.totalCount) ||
    toNum(raw?.totalReviews) ||
    safeItems.length;

  const avgRating =
    toNum(raw?.avgRating) ||
    toNum(raw?.averageRating) ||
    toNum(raw?.avg) ||
    calcAvg(safeItems);

  const page = toNum(raw?.page) || 1;
  const pages = toNum(raw?.pages) || 1;

  return { items: safeItems, avgRating, count, page, pages };
}

const isOfflineLike = (e) => {
  const msg = String(e?.message || "");
  // Axios network errors often have no response
  return !e?.response && (msg.includes("Network Error") || msg.includes("ECONNREFUSED") || msg.includes("Failed to fetch"));
};

export default function ProductReviews({ productId, token: tokenProp, onStatsChange }) {
  const [data, setData] = useState(() =>
    normalizeReviewsResponse({ items: [], avgRating: 0, count: 0, page: 1, pages: 1 })
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({ rating: 5, title: "", text: "" });

  const token = useMemo(() => tokenProp || localStorage.getItem("token") || "", [tokenProp]);
  const canPost = !!token;

  const headers = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const load = useCallback(
    async (page = 1) => {
      if (!productId) return;

      setLoading(true);
      setErr("");

      try {
        const r = await axios.get(`${API_URL}/api/reviews/product/${productId}`, {
          params: { page, limit: 10 },
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });

        const normalized = normalizeReviewsResponse(r.data);
        setData(normalized);
        onStatsChange?.({ avgRating: normalized.avgRating, count: normalized.count });
      } catch (e) {
        // ✅ 404 = endpoint exists? Actually means route not found OR product invalid on backend
        // For UI: treat it as "no reviews yet" to avoid ugly error.
        if (e?.response?.status === 404) {
          const normalized = normalizeReviewsResponse({ items: [] });
          setData(normalized);
          onStatsChange?.({ avgRating: 0, count: 0 });
          setErr("");
          return;
        }

        if (isOfflineLike(e)) {
          const normalized = normalizeReviewsResponse({ items: [] });
          setData(normalized);
          onStatsChange?.({ avgRating: 0, count: 0 });
          setErr("Немає з’єднання з сервером. Перевірте, чи запущено бекенд (порт 5000).");
          return;
        }

        setErr(e?.response?.data?.message || e?.message || "Error loading reviews");
        const normalized = normalizeReviewsResponse({ items: [] });
        setData(normalized);
        onStatsChange?.({ avgRating: 0, count: 0 });
      } finally {
        setLoading(false);
      }
    },
    [productId, onStatsChange]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!canPost) {
      setErr("Увійдіть, щоб залишити відгук.");
      return;
    }

    try {
      await axios.post(`${API_URL}/api/reviews`, { productId, ...form }, { headers });
      setForm({ rating: 5, title: "", text: "" });
      await load(1);
    } catch (e2) {
      if (isOfflineLike(e2)) {
        setErr("Немає з’єднання з сервером. Перевірте, чи запущено бекенд.");
        return;
      }
      setErr(e2?.response?.data?.message || e2?.message || "Error saving review");
    }
  };

  return (
    <div className="product-reviews">
      <div className="product-reviews__header">
        <h2 className="product-reviews__title">Відгуки</h2>

        <div className="product-reviews__summary">
          <Stars value={data.avgRating} />
          <span className="product-reviews__count">({data.count})</span>
        </div>
      </div>

      {err && <div className="product-reviews__alert product-reviews__alert--error">{err}</div>}

      <div>
        {loading && <div className="product-reviews__loading">Завантаження...</div>}

        {!loading && data.items.length === 0 && (
          <div className="product-reviews__empty">Поки немає відгуків. Будь першим!</div>
        )}

        {data.items.map((r) => (
          <div key={r._id} className="review-card">
            <div className="review-card__header">
              <div className="review-card__user">{r.user?.name || r.user?.email || "User"}</div>
              <Stars value={r.rating} />
            </div>

            {r.title && <div className="review-card__title">{r.title}</div>}
            {r.text && <div className="review-card__text">{r.text}</div>}

            <div className="review-card__date">{new Date(r.createdAt).toLocaleString("uk-UA")}</div>
          </div>
        ))}

        {data.pages > 1 && (
          <div className="product-reviews__pagination">
            <button
              className="pagination-btn"
              disabled={data.page <= 1}
              onClick={() => load(data.page - 1)}
              type="button"
            >
              Prev
            </button>

            <button
              className="pagination-btn"
              disabled={data.page >= data.pages}
              onClick={() => load(data.page + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="product-reviews__form-section">
        <h3 className="form-title">Залишити відгук</h3>

        {!canPost ? (
          <div className="product-reviews__empty" style={{ textAlign: "left", padding: 0 }}>
            Увійдіть, щоб залишити відгук.
          </div>
        ) : (
          <form onSubmit={submit} className="review-form">
            <label className="review-form__label">
              Рейтинг (1–5)
              <select
                className="review-form__select"
                value={form.rating}
                onChange={(e) => setForm((p) => ({ ...p, rating: Number(e.target.value) }))}
              >
                {[5, 4, 3, 2, 1].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>

            <input
              className="review-form__input"
              placeholder="Заголовок (необов’язково)"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />

            <textarea
              className="review-form__textarea"
              placeholder="Текст відгуку"
              rows={4}
              value={form.text}
              onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
              required
            />

            <button type="submit" className="review-form__submit">
              Опублікувати
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
