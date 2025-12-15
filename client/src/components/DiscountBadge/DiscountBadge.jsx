// src/components/DiscountBadge.jsx
import React from "react";
import "./DiscountBadge.css";

export default function DiscountBadge({ discount }) {
  if (!discount || discount <= 0) return null;

  return (
    <div className="discount-badge">
      -{discount}%
    </div>
  );
}
