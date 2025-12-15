import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true
});

// Отримати всі товари
export const fetchProducts = () => API.get("/products");

// Додати товар (адмін)
export const addProduct = (product) => API.post("/admin/products", product);

// Оновити товар (адмін)
export const updateProduct = (id, updatedProduct) => API.put(`/admin/products/${id}`, updatedProduct);

// Видалити товар (адмін)
export const deleteProduct = (id) => API.delete(`/admin/products/${id}`);
