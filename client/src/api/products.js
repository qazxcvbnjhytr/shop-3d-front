import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";

const normalizeOrigin = (url) => String(url || "").replace(/\/+$/, "");
const normalizePrefix = (p) => {
  const s = String(p || "/api").trim();
  if (!s) return "/api";
  return s.startsWith("/") ? s.replace(/\/+$/, "") : `/${s.replace(/\/+$/, "")}`;
};

if (!API_URL) {
  throw new Error("Missing VITE_API_URL in client/.env(.local)");
}

const baseURL = `${normalizeOrigin(API_URL)}${normalizePrefix(API_PREFIX)}`;

const API = axios.create({
  baseURL,
  withCredentials: true,
});

// Отримати всі товари
export const fetchProducts = () => API.get("/products");

// Додати товар (адмін)
export const addProduct = (product) => API.post("/admin/products", product);

// Оновити товар (адмін)
export const updateProduct = (id, updatedProduct) =>
  API.put(`/admin/products/${id}`, updatedProduct);

// Видалити товар (адмін)
export const deleteProduct = (id) => API.delete(`/admin/products/${id}`);
