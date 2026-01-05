// client/src/pages/DinamicProduct/RatingStars/RatingStars.jsx
import React from "react";
import "./RatingStars.css";

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export default function RatingStars({
  // ✅ підтримка обох API: value або rating
  value,
  rating,
  count = 0,

  max = 5,
  size = 14,
  className = "",
}) {
  const raw = value != null ? value : rating;
  const v = clamp(toNum(raw), 0, max);
  const pct = (v / max) * 100;

  const c = Math.max(0, Math.floor(toNum(count)));

  return (
    <span
      className={`rs ${className}`}
      style={{ ["--pct"]: `${pct}%`, fontSize: size }}
      aria-label={`Рейтинг: ${v} з ${max}${c ? `, відгуків: ${c}` : ""}`}
      title={`${v} / ${max}${c ? ` (${c})` : ""}`}
    >
      <span className="rs-base" aria-hidden="true">★★★★★</span>
      <span className="rs-fill" aria-hidden="true">★★★★★</span>
    </span>
  );
}
