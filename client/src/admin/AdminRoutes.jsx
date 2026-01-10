import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout.jsx";

import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminCategories from "./pages/AdminCategories.jsx";
import AdminProducts from "./pages/AdminProducts.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminChat from "./pages/AdminChat.jsx";
import AdminTranslations from "./pages/AdminTranslations.jsx";
import AdminOrders from "./pages/AdminOrders/AdminOrders.jsx";


export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="chat" element={<AdminChat />} />
        <Route path="translations" element={<AdminTranslations />} />
<Route path="orders" element={<AdminOrders />} />

        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
