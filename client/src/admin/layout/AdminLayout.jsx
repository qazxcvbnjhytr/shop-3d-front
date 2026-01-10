// client/src/admin/layout/AdminLayout.jsx
import React, { useMemo } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import "./admin.css";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const title = useMemo(() => {
    const p = location.pathname;
    if (p.includes("/admin/products")) return "Products";
    if (p.includes("/admin/categories")) return "Categories";
    if (p.includes("/admin/users")) return "Users";
    if (p.includes("/admin/orders")) return "Orders";
    if (p.includes("/admin/chat")) return "Chat";
    if (p.includes("/admin/translations")) return "Translations";
    return "Dashboard";
  }, [location.pathname]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div>
            <div className="admin-brand-title">MebliHub Admin</div>
            <div className="admin-brand-sub">/admin</div>
          </div>
          <button className="btn" onClick={() => navigate("/")}>Store</button>
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
            <div className="desc">
              API: {import.meta.env.VITE_API_URL || "http://localhost:5000"}
            </div>
          </div>
          <div className="admin-actions">
            <button className="btn" onClick={() => window.location.reload()}>Reload</button>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
