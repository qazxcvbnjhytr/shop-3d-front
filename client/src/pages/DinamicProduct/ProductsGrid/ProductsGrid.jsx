import React, { useMemo } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

import ProductCard from "../ProductCard/ProductCard";
import { useProductRatings } from "../../../hooks/useProductRatings";

export default function ProductsGrid({
  products = [],
  itemsPerPage = 9,
  currentPage = 1,
  onPageChange,

  apiUrl,
  category,
  subKey,
  lang,

  hasAnyActiveFilter,
  q,
}) {
  const totalPages = Math.max(1, Math.ceil((products?.length || 0) / itemsPerPage));

  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const currentItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, safePage, itemsPerPage]);

  const { ratingsMap } = useProductRatings({ items: currentItems, apiUrl });

  const paginate = (page) => {
    if (!onPageChange) return;
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="dp-content">
      <div className="catalog-grid">
        {currentItems.length ? (
          currentItems.map((item) => {
            const cached = ratingsMap?.[item?._id];
            const rating = Number(cached?.avgRating) || 0;
            const count = Number(cached?.count) || 0;

            return (
              <ProductCard
                key={item._id}
                item={item}
                apiUrl={apiUrl}
                category={category}
                subKey={subKey}
                lang={lang}
                rating={rating}
                count={count}
              />
            );
          })
        ) : (
          <div className="empty-state">
            <p>
              {hasAnyActiveFilter || q
                ? lang === "ua"
                  ? "Нічого не знайдено за фільтрами."
                  : "Nothing found for your filters."
                : lang === "ua"
                ? "В цій підкатегорії поки немає товарів."
                : "No products in this subcategory yet."}
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={safePage === 1} onClick={() => paginate(safePage - 1)}>
            <FaChevronLeft />
          </button>

          <span>
            {safePage} / {totalPages}
          </span>

          <button disabled={safePage === totalPages} onClick={() => paginate(safePage + 1)}>
            <FaChevronRight />
          </button>
        </div>
      )}
    </section>
  );
}
