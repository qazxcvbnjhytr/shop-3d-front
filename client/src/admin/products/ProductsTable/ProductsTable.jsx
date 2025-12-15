// client/src/admin/products/ProductsTable/ProductsTable.jsx
import React, { useMemo, useState } from "react";
import { FaEdit, FaTrashAlt, FaEye, FaSort } from "react-icons/fa";
import { useTranslation } from "../../../hooks/useTranslation";
import "./ProductsTable.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ProductsTable({
  products = [],
  categories = [],
  isLoading = false,
  onEdit,
  onDelete,
}) {
  // ✅ hooks ALWAYS first
  const { t, loading: tLoading } = useTranslation();

  const [selectedId, setSelectedId] = useState(null);
  const [sortKey, setSortKey] = useState(null); // "name" | "price"
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"

  const texts = t?.admin?.productsTable || {};

  const getCategoryName = (code) =>
    categories.find((c) => c.category === code)?.names?.ua || code || "-";

  const sortedProducts = useMemo(() => {
    if (!sortKey) return products;

    const dir = sortDir === "asc" ? 1 : -1;

    return [...products].sort((a, b) => {
      if (sortKey === "price") {
        const av = Number(a?.price ?? 0);
        const bv = Number(b?.price ?? 0);
        return (av - bv) * dir;
      }

      const av = (a?.name?.ua || "").toLowerCase();
      const bv = (b?.name?.ua || "").toLowerCase();
      if (av > bv) return 1 * dir;
      if (av < bv) return -1 * dir;
      return 0;
    });
  }, [products, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((p) => (p === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // ✅ returns only AFTER hooks
  if (tLoading) return null;

  if (isLoading) {
    return <p className="pt-loading">{texts.loading || "Завантаження товарів…"}</p>;
  }

  return (
    <div className="pt-wrap">
      <div className="pt-tableWrap">
        <table className="pt-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{texts.image || "Зображення"}</th>

              <th
                className="pt-sort"
                onClick={() => toggleSort("name")}
                title={texts.sortByName || "Сортувати за назвою"}
              >
                <span>{texts.name || "Назва (UA)"}</span>
                <FaSort className="pt-sortIcon" />
                {sortKey === "name" && (
                  <span className="pt-sortDir">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>

              <th>{texts.category || "Категорія"}</th>

              <th
                className="pt-sort"
                onClick={() => toggleSort("price")}
                title={texts.sortByPrice || "Сортувати за ціною"}
              >
                <span>{texts.price || "Ціна"}</span>
                <FaSort className="pt-sortIcon" />
                {sortKey === "price" && (
                  <span className="pt-sortDir">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>

              <th>{texts.actions || "Дії"}</th>
            </tr>
          </thead>

          <tbody>
            {sortedProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="pt-empty">
                  {texts.empty || "Немає жодного товару"}
                </td>
              </tr>
            ) : (
              sortedProducts.map((p, i) => {
                const previewImage = p?.images?.length ? p.images[0] : p?.image;

                return (
                  <tr
                    key={p?._id || i}
                    className={selectedId === p?._id ? "is-selected" : ""}
                    onClick={() => setSelectedId(p?._id)}
                  >
                    <td>{i + 1}</td>

                    <td>
                      {previewImage ? (
                        <img
                          className="pt-img"
                          src={`${API_URL}${previewImage}`}
                          alt={p?.name?.ua || "preview"}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.png";
                          }}
                        />
                      ) : (
                        <FaEye className="pt-eye" title={texts.noImage || "Немає зображення"} />
                      )}
                    </td>

                    <td className="pt-title">{p?.name?.ua || "-"}</td>
                    <td>{getCategoryName(p?.category)}</td>
                    <td className="pt-price">{p?.price ? `${p.price} грн` : "-"}</td>

                    <td>
                      <div className="pt-actions">
                        <button
                          type="button"
                          className="pt-btn pt-btn-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(p);
                          }}
                          title={texts.edit || "Редагувати"}
                        >
                          <FaEdit />
                        </button>

                        <button
                          type="button"
                          className="pt-btn pt-btn-del"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(p?._id);
                          }}
                          title={texts.delete || "Видалити"}
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
