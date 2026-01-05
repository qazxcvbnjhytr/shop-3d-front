import React from "react";
import "./DiscountBadge.css";

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Props:
 * - discount: number
 * - mode: "percent" | "uah"  (default "percent")
 * - variant: "overlay" | "inline" (default "overlay")
 * - suffix: string (default "грн" for uah)
 */
export default function DiscountBadge({
  discount,
  mode = "percent",
  variant = "overlay",
  suffix = "грн",
  className = "",
}) {
  const d = toNum(discount);
  if (!d || d <= 0) return null;

  const isInline = variant === "inline";
  const label = mode === "uah" ? `Discount -${d} ${suffix}` : `Discount -${d}%`;
  const text = mode === "uah" ? `-${Math.round(d)} ${suffix}` : `-${Math.round(d)}%`;

  return (
    <div
      className={`badge-wrapper ${isInline ? "badge-wrapper--inline" : ""} ${className}`}
      aria-label={label}
      title={label}
    >
      <div className="discount-badge">{text}</div>
    </div>
  );
}
