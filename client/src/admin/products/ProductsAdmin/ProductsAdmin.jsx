import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaSpinner } from "react-icons/fa";

import ProductsTable from "../ProductsTable/ProductsTable";
import ProductFormModal from "../FormsAdd/FormsAdd";

import "./ProductsAdmin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* =========================
   INITIAL FORM STATE
========================= */
const initialProductState = {
  _id: null,
  name_ua: "",
  name_en: "",
  category: "",
  price: "",
  discount: "",
  images: null,
  modelFile: null,
  currentImages: [],
  currentModel: null,
};

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(initialProductState);

  const token = localStorage.getItem("token");

  const axiosAuth = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await axiosAuth.get("/api/products");
      setProducts(res.data || []);
    } catch (err) {
      console.error("Помилка завантаження товарів:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosAuth.get("/api/categories");
      setCategories(res.data || []);
    } catch (err) {
      console.error("Помилка завантаження категорій:", err);
    }
  };

  /* =========================
     MODAL CONTROL
  ========================= */
  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(initialProductState);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);

    setFormData({
      _id: product._id,
      name_ua: product.name?.ua || "",
      name_en: product.name?.en || "",
      category: product.category || "",
      price: product.price || "",
      discount: product.discount || "",
      images: null,
      modelFile: null,
      currentImages: product.images || [],
      currentModel: product.modelUrl || null,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormData(initialProductState);
  };

  /* =========================
     SUBMIT (POST / PUT)
  ========================= */
  const handleSubmit = async () => {
    try {
      const form = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value === null || value === "") return;

        if (key === "images" && Array.isArray(value)) {
          value.forEach((file) => form.append("images", file));
          return;
        }

        if (key === "modelFile" && value instanceof File) {
          form.append("modelFile", value);
          return;
        }

        if (key === "currentImages" || key === "currentModel") {
          form.append(key, JSON.stringify(value));
          return;
        }

        form.append(key, value);
      });

      if (editingProduct) {
        await axiosAuth.put(`/api/products/${editingProduct._id}`, form);
      } else {
        await axiosAuth.post("/api/products", form);
      }

      closeModal();
      fetchProducts();
    } catch (err) {
      console.error("❌ SAVE ERROR:", err);
      alert("Помилка збереження товару");
    }
  };

  /* =========================
     DELETE
  ========================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Ви впевнені, що хочете видалити товар?")) return;

    try {
      await axiosAuth.delete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Помилка видалення:", err);
      alert("Помилка при видаленні товару");
    }
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="products-admin-container">
      <h1 className="products-admin-title">Управління товарами</h1>

      <button className="add-product-btn" onClick={openAddModal}>
        <FaPlus /> Додати товар
      </button>

      {isLoading && (
        <div className="loading-status">
          <FaSpinner className="spinner" /> Завантаження...
        </div>
      )}

      <ProductsTable
        products={products}
        categories={categories}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      {modalOpen && (
        <ProductFormModal
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          isEditing={!!editingProduct}
          handleAction={handleSubmit}
          closeModal={closeModal}
        />
      )}
    </div>
  );
}
