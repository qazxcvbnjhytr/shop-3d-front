// client/src/api/ordersApi.js
import axiosInstance from "./axiosInstance.js";

export const ordersApi = {
  // POST /api/orders
  createMy: async (payload) => {
    const { data } = await axiosInstance.post("/orders", payload);
    return data;
  },

  // GET /api/orders/my
  listMy: async () => {
    const { data } = await axiosInstance.get("/orders/my");
    return data;
  },

  // GET /api/orders/my/:id
  getMy: async (id) => {
    const { data } = await axiosInstance.get(`/orders/my/${id}`);
    return data;
  },
};
