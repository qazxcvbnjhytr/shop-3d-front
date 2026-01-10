// client/src/hooks/useProductRatings.js
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const RAW = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE = String(RAW).replace(/\/+$/, "");

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

const normalizeReviewsResponse = (raw) => {
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

  return { avgRating, count };
};

const cache = new Map(); // productId -> { avgRating, count }

export function useProductRatings({ items = [] } = {}) {
  const ids = useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    const uniq = new Set();
    arr.forEach((p) => {
      const id = p?._id || p?.id;
      if (id) uniq.add(String(id));
    });
    return Array.from(uniq);
  }, [items]);

  const idsKey = useMemo(() => ids.join(","), [ids]);

  const [ratingsMap, setRatingsMap] = useState(() => {
    const m = {};
    ids.forEach((id) => {
      if (cache.has(id)) m[id] = cache.get(id);
    });
    return m;
  });

  const [loading, setLoading] = useState(false);
  const reqSeq = useRef(0);

  useEffect(() => {
    let alive = true;
    const seq = ++reqSeq.current;

    const missing = ids.filter((id) => !cache.has(id));

    setRatingsMap(() => {
      const m = {};
      ids.forEach((id) => {
        if (cache.has(id)) m[id] = cache.get(id);
      });
      return m;
    });

    if (!missing.length) return;

    (async () => {
      try {
        setLoading(true);

        const results = await Promise.all(
          missing.map(async (id) => {
            const r = await axios.get(`${BASE}/api/reviews/product/${id}`, {
              params: { page: 1, limit: 10 },
              headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
            });
            return [id, normalizeReviewsResponse(r.data)];
          })
        );

        if (!alive || seq !== reqSeq.current) return;

        results.forEach(([id, data]) => cache.set(id, data));

        setRatingsMap(() => {
          const m = {};
          ids.forEach((id) => {
            if (cache.has(id)) m[id] = cache.get(id);
          });
          return m;
        });
      } catch (e) {
        if (!alive) return;
        console.warn("[Ratings] load error:", e?.response?.data || e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [idsKey]);

  return { ratingsMap, loading };
}
