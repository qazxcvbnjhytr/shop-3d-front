import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import "./App.css";

import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import Breadcrumbs from "./components/Breadcrumbs/Breadcrumbs.jsx";

// !!! ТУТ БУЛА ПОМИЛКА: треба імпортувати з ChatWidget.jsx, а не ChatBox.jsx
import ChatWidget from "./components/ChatWidget.jsx"; 

// Pages
import ShoppingCart from "./pages/ShoppingCart/ShoppingCart.jsx";
import Home from "./pages/Home/Home.jsx";
import Catalog from "./pages/Catalog/Catalog.jsx";
import WhereToBuy from "./pages/WhereToBuy/WhereToBuy.jsx";
import Sales from "./pages/Sales/Sales.jsx";
import Contacts from "./pages/Contacts/Contacts.jsx";
import About from "./pages/About/About.jsx";
import CollectionsPage from "./pages/collections/collections.jsx";
import CollectionPage from "./pages/collections/collection/collection.jsx";
import DownloadCatalog from "./pages/DownloadCatalog/DownloadCatalog.jsx";
import Account from "./pages/account/AccountPage.jsx";
import Favorites from "./pages/Favorites/Favorites.jsx";
import SubCategories from "./pages/SubCategories/SubCategories.jsx";
import DinamicProduct from "./pages/DinamicProduct/DinamicProduct.jsx";
import ProductPage from "./pages/ProductPage/ProductPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.jsx";
import BannedPage from "./pages/auth/BannedPage.jsx";
import Checkout from "./pages/Checkout/Checkout.jsx";

// Admin
import AdminApp from "./admin/AdminApp.jsx";

function StorefrontLayout({ viewerRef }) {
  return (
    <div id="app">
      <Header />
      <Breadcrumbs />

      <div className="page-container">
        <Outlet />
      </div>

      <Footer />
      
      {/* Віджет додано тут, це правильно. Головне, щоб це був саме ChatWidget */}
      <ChatWidget />
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const viewerRef = useRef();

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setLoading(false), 800);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingScreen fadeOut={fadeOut} />;

  return (
    <Router>
      <Routes>
        {/* ADMIN */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* STOREFRONT */}
        <Route element={<StorefrontLayout viewerRef={viewerRef} />}>
          <Route path="/" element={<Home viewerRef={viewerRef} />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/where-to-buy" element={<WhereToBuy />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/about" element={<About />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/banned" element={<BannedPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:key" element={<CollectionPage />} />
          <Route path="/download-catalog" element={<DownloadCatalog />} />
          <Route path="/account" element={<Account />} />
          <Route path="/shopping-cart" element={<ShoppingCart />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/catalog/:category" element={<SubCategories />} />
          <Route path="/catalog/:category/:sub" element={<DinamicProduct />} />
          <Route path="/catalog/:category/:sub/:id" element={<ProductPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Route>
      </Routes>
    </Router>
  );
}