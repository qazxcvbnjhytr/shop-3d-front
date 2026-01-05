import React from "react";
import HomeProductCard from "../HomeProductCard/HomeProductCard";
import "./ProductTabs.css";

export default function ProductTabs({
  tab = "hits",
  setTab,
  loading,
  products = [],
  lang = "ua",
  getImg,
  pickText,
}) {
  return (
    <section className="pt">
      <div className="pt__head">
        <h2 className="pt__h2">Добірки</h2>

        <div className="pt__tabs">
          <button
            className={`pt__tab ${tab === "hits" ? "is-active" : ""}`}
            onClick={() => setTab?.("hits")}
            type="button"
          >
            Хіти
          </button>

          <button
            className={`pt__tab ${tab === "discounts" ? "is-active" : ""}`}
            onClick={() => setTab?.("discounts")}
            type="button"
          >
            Акції
          </button>

          <button
            className={`pt__tab ${tab === "new" ? "is-active" : ""}`}
            onClick={() => setTab?.("new")}
            type="button"
          >
            Новинки
          </button>
        </div>
      </div>

      {loading ? (
        <div className="pt__status">Завантаження товарів...</div>
      ) : !products?.length ? (
        <div className="pt__status">Немає товарів для відображення.</div>
      ) : (
        <div className="pt__grid">
          {products.map((p, idx) => (
            <HomeProductCard
              key={p?._id || p?.id || `${idx}`}
              p={p}
              lang={lang}
              getImg={getImg}
              pickText={pickText}
            />
          ))}
        </div>
      )}
    </section>
  );
}
