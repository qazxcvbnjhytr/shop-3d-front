import React from "react";
import { Link } from "react-router-dom";
import "./PopularCategories.css";

export default function PopularCategories({ items = [] }) {
  return (
    <section className="pc">
      <div className="pc__head">
        <h2 className="pc__h2">Популярні категорії</h2>
        <Link className="pc__link" to="/catalog">Перейти в каталог →</Link>
      </div>

      <div className="pc__grid">
        {items.map((c) => (
          <Link key={c.key} to={`/catalog/${c.key}`} className="pc__tile">
            <div className="pc__title">{c.label}</div>
            <div className="pc__hint">Переглянути</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
