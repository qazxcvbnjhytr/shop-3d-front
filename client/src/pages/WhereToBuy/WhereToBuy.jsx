import React, { useEffect, useState } from "react";
import "./WhereToBuy.css";
import WhereToBuyMap from "./WhereToBuyMap/WhereToBuyMap";
import { useTranslation } from "../../hooks/useTranslation";

import api from "@/api/api"; // якщо нема alias "@/": заміни на відносний шлях

export default function WhereToBuy() {
  const { t } = useTranslation();
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // ✅ api вже містить baseURL = .../api
        const { data } = await api.get("/locations");
        if (cancelled) return;

        setPoints(Array.isArray(data) ? data : []);
      } catch (e) {
        if (cancelled) return;
        setErr("Не вдалося завантажити точки. Перевір /api/locations на бекенді.");
        setPoints([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="where-to-buy-page">
      <div className="where-to-buy-container">
        <div className="where-to-buy-hero">
          <h1 className="where-to-buy-title">{t?.whereToBuy?.title || "Where to Buy"}</h1>
          <p className="where-to-buy-subtitle">
            {t?.whereToBuy?.subtitle || "Знайдіть найближчий шоурум або склад нашої мережі по всій Україні."}
          </p>
        </div>

        {loading && <div className="wtb-loading">Завантаження…</div>}
        {!loading && err && <div className="wtb-error">{err}</div>}

        {!loading && !err && <WhereToBuyMap points={points} />}
      </div>
    </div>
  );
}
