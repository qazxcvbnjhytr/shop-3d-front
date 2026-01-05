// client/src/admin/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import { adminApi } from "../api/adminApi.js";
import { endpoints } from "../api/endpoints.js";
import { useToast } from "../components/Toast.jsx";

export default function AdminDashboard() {
  const toast = useToast();
  const [kpi, setKpi] = useState({
    products: 0,
    categories: 0,
    users: 0,
    conversations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        // Пытаемся админскими эндпоинтами.
        // Если у тебя их пока нет — будет 404, тогда поменяешь под публичные.
        const [prod, cat, users, conv] = await Promise.allSettled([
          adminApi.get(endpoints.adminProducts),
          adminApi.get(endpoints.adminCategories),
          adminApi.get(endpoints.adminUsers),
          adminApi.get(endpoints.chatConversations),
        ]);

        const products = prod.status === "fulfilled" ? (prod.value.data?.length || 0) : 0;
        const categories = cat.status === "fulfilled" ? (cat.value.data?.length || 0) : 0;
        const usersCount = users.status === "fulfilled" ? (users.value.data?.length || 0) : 0;
        const conversations = conv.status === "fulfilled" ? (conv.value.data?.length || 0) : 0;

        if (!alive) return;
        setKpi({ products, categories, users: usersCount, conversations });
      } catch (e) {
        toast.error(e.friendlyMessage || "Failed to load dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [toast]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of admin resources."
      />

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div style={{ opacity: 0.7 }}>Loading…</div>
          ) : (
            <div className="grid cols-4">
              <div className="kpi">
                <div className="label">Products</div>
                <div className="value">{kpi.products}</div>
              </div>
              <div className="kpi">
                <div className="label">Categories</div>
                <div className="value">{kpi.categories}</div>
              </div>
              <div className="kpi">
                <div className="label">Users</div>
                <div className="value">{kpi.users}</div>
              </div>
              <div className="kpi">
                <div className="label">Chat conversations</div>
                <div className="value">{kpi.conversations}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
