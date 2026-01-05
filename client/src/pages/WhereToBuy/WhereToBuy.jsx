import React, { useEffect, useState } from "react";
import axios from "axios";
import "./WhereToBuy.css";
import WhereToBuyMap from "./WhereToBuyMap/WhereToBuyMap";
import { useTranslation } from "../../hooks/useTranslation";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

        const { data } = await axios.get(`${API_URL}/api/locations`);
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
      {/* ✅ Контейнер з max-width і боковими відступами */}
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
