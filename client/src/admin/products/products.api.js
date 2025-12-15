import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const createAxiosAuth = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getProducts = (axiosAuth) =>
  axiosAuth.get("/api/products");

export const getCategories = (axiosAuth) =>
  axiosAuth.get("/api/categories");

export const createProduct = (axiosAuth, data, config) =>
  axiosAuth.post("/api/products", data, config);

export const updateProduct = (axiosAuth, id, data, config) =>
  axiosAuth.put(`/api/products/${id}`, data, config);

export const deleteProduct = (axiosAuth, id) =>
  axiosAuth.delete(`/api/products/${id}`);
