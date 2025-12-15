import React from "react";

export default function SpecsTab({ product }) {
  return (
    <div className="tab-content">
      <h2>Характеристики</h2>
      <ul>
        <li>Вес: {product.weight || "-"}</li>
        <li>Размер спального места: {product.bedSize || "-"}</li>
        <li>Ширина: {product.width || "-"}</li>
        <li>Высота: {product.height || "-"}</li>
        <li>Длина: {product.length || "-"}</li>
        <li>Материал: {product.material || "-"}</li>
        <li>Гарантия: {product.warranty || "-"}</li>
        <li>Производитель: {product.manufacturer || "-"}</li>
        <li>Страна производства: {product.country || "-"}</li>
      </ul>
    </div>
  );
}
