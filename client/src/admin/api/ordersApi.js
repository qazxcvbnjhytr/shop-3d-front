// client/src/admin/api/ordersApi.js
import axiosInstance from "../../api/axiosInstance.js";

export function createOrdersApi() {
  return {
    // GET /api/admin/orders?q=&status=&page=&limit=
    async list({ q = "", status = "", page = 1, limit = 20 } = {}) {
      const res = await axiosInstance.get("/admin/orders", {
        params: { q, status, page, limit },
      });
      return res.data;
    },

    // GET /api/admin/orders/:id
    async getOne(id) {
      const res = await axiosInstance.get(`/admin/orders/${id}`);
      return res.data;
    },

    // PATCH /api/admin/orders/:id
    async patch(id, payload) {
      const res = await axiosInstance.patch(`/admin/orders/${id}`, payload);
      return res.data;
    },

    // POST /api/admin/orders/:id/cancel
    async cancel(id, reason = "") {
      const res = await axiosInstance.post(`/admin/orders/${id}/cancel`, { reason });
      return res.data;
    },

    // DELETE /api/admin/orders/:id
    async remove(id) {
      const res = await axiosInstance.delete(`/admin/orders/${id}`);
      return res.data;
    },
  };
}
