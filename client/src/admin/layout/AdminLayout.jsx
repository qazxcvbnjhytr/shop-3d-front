// client/src/admin/layout/AdminLayout.jsx
import React, { useMemo } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import "./admin.css";

const API_URL = import.meta.env.VITE_API_URL; // ✅ env-first

function getTitle(pathname) {
  const p = String(pathname || "");
  if (p.includes("/admin/products")) return "Products";
  if (p.includes("/admin/categories")) return "Categories";
  if (p.includes("/admin/users")) return "Users";
  if (p.includes("/admin/orders")) return "Orders";
  if (p.includes("/admin/chat")) return "Chat";
  if (p.includes("/admin/translations")) return "Translations";
  return "Dashboard";
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const title = useMemo(() => getTitle(location.pathname), [location.pathname]);

  // ✅ красиво показати API в UI (і не падати якщо env нема)
  const apiLabel = useMemo(() => {
    if (!API_URL) return "VITE_API_URL is not set";
    return API_URL;
  }, []);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div>
            <div className="admin-brand-title">MebliHub Admin</div>
            <div className="admin-brand-sub">/admin</div>
          </div>

          <button className="btn" type="button" onClick={() => navigate("/")}>
            Store
          </button>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin/dashboard" end className={({ isActive }) => (isActive ? "active" : "")}>
            Dashboard
          </NavLink>

          <NavLink to="/admin/products" className={({ isActive }) => (isActive ? "active" : "")}>
            Products
          </NavLink>

          <NavLink to="/admin/categories" className={({ isActive }) => (isActive ? "active" : "")}>
            Categories
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => (isActive ? "active" : "")}>
            Users
          </NavLink>

          <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? "active" : "")}>
            Orders
          </NavLink>

          <NavLink to="/admin/chat" className={({ isActive }) => (isActive ? "active" : "")}>
            Chat
          </NavLink>

          <NavLink to="/admin/translations" className={({ isActive }) => (isActive ? "active" : "")}>
            Translations
          </NavLink>
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div className="meta">
            <div className="title">{title}</div>
            <div className="desc">API: {apiLabel}</div>
          </div>

          <div className="admin-actions">
            <button className="btn" type="button" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
