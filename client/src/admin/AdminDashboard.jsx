import React, { useState } from "react";
import ProductsAdmin from "./products/ProductsAdmin/ProductsAdmin.jsx";
import CategoriesAdmin from "./categories/CategoriesAdmin.jsx";
import OrdersAdmin from "./orders/OrdersAdmin.jsx";
import UsersAdmin from "./users/UsersAdmin.jsx";
import SalesReport from "./reports/SalesReport.jsx";
import InventoryReport from "./reports/InventoryReport.jsx";
import BannersAdmin from "./content/BannersAdmin.jsx";
import NewsAdmin from "./content/NewsAdmin.jsx";
import AdminsAdmin from "./settings/AdminsAdmin.jsx";
import PaymentDeliverySettings from "./settings/PaymentDeliverySettings.jsx";
import "./style/AdminDashboard.css"; // створи цей файл для стилів адмінки

export default function AdminDashboard() {
  const [tab, setTab] = useState("products");

  return (
    <div className="admin-dashboard container mt-4">
      <h1>Адмін Панель Меблевого Магазину</h1>

      <div className="tabs mb-3 d-flex flex-wrap gap-2">
        <button onClick={() => setTab("products")} className={tab === "products" ? "active" : ""}>
          Товари
        </button>
        <button onClick={() => setTab("categories")} className={tab === "categories" ? "active" : ""}>
          Категорії
        </button>
        <button onClick={() => setTab("orders")} className={tab === "orders" ? "active" : ""}>
          Замовлення
        </button>
        <button onClick={() => setTab("users")} className={tab === "users" ? "active" : ""}>
          Користувачі
        </button>
        <button onClick={() => setTab("salesReport")} className={tab === "salesReport" ? "active" : ""}>
          Звіт Продажів
        </button>
        <button onClick={() => setTab("inventoryReport")} className={tab === "inventoryReport" ? "active" : ""}>
          Інвентаризація
        </button>
        <button onClick={() => setTab("banners")} className={tab === "banners" ? "active" : ""}>
          Банери
        </button>
        <button onClick={() => setTab("news")} className={tab === "news" ? "active" : ""}>
          Новини
        </button>
        <button onClick={() => setTab("admins")} className={tab === "admins" ? "active" : ""}>
          Адміни
        </button>
        <button onClick={() => setTab("settings")} className={tab === "settings" ? "active" : ""}>
          Налаштування
        </button>
      </div>

      <div className="tab-content">
        {tab === "products" && <ProductsAdmin />}
        {tab === "categories" && <CategoriesAdmin />}
        {tab === "orders" && <OrdersAdmin />}
        {tab === "users" && <UsersAdmin />}
        {tab === "salesReport" && <SalesReport />}
        {tab === "inventoryReport" && <InventoryReport />}
        {tab === "banners" && <BannersAdmin />}
        {tab === "news" && <NewsAdmin />}
        {tab === "admins" && <AdminsAdmin />}
        {tab === "settings" && <PaymentDeliverySettings />}
      </div>
    </div>
  );
}
