// src/App.jsx (Виправлений)

import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'; 

// Contexts
import { LanguageProvider } from "./context/LanguageProvider";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LikesProvider } from "./context/LikesContext";

// Components
import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import PrivateRoute from "./components/PrivateRoute";
import Breadcrumbs from "./components/Breadcrumbs/Breadcrumbs.jsx";

// Pages
import ShoppingCart from './pages/ShoppingCart/ShoppingCart';
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog/Catalog.jsx";
import WhereToBuy from "./pages/WhereToBuy.jsx";
import News from "./pages/News.jsx";
import Contacts from "./pages/Contacts/Contacts.jsx";
import About from "./pages/About/About.jsx";
import RequestPrice from "./pages/RequestPrice.jsx";
import DownloadCatalog from "./pages/DownloadCatalog.jsx";
import Account from "./pages/account/AccountPage.jsx";

// Categories
// 🔥 ВИПРАВЛЕНО ШЛЯХ: ДОДАНО /DinamicProduct
import DinamicProduct from "./pages/DinamicProduct/DinamicProduct.jsx";

// Dynamic product page
import ProductPage from "./pages/ProductPage/ProductPage.jsx";

// Auth
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.jsx";

// Admin
import AdminDashboard from "./admin/AdminDashboard.jsx";

function App() {
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
    <LanguageProvider>
      <AuthProvider>
        <LikesProvider>
          <Router>
            <div id="app">
              <Header />
              <Breadcrumbs />  
              <div className="page-container">
                <Routes>
                  {/* Main pages */}
                  <Route path="/shopping-cart" element={<ShoppingCart />} />
                  <Route path="/" element={<Home viewerRef={viewerRef} />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/where-to-buy" element={<WhereToBuy />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/request-price" element={<RequestPrice />} />
                  <Route path="/download-catalog" element={<DownloadCatalog />} />
                  <Route path="/account" element={<Account />} />

                  {/* Categories */}
                  <Route path="/catalog/:category" element={<DinamicProduct />} />

                  {/* Product page */}
                  <Route path="/catalog/:category/:id" element={<ProductPage />} />

                  {/* Auth */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/auth/register" element={<RegisterPage />} />
                  <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

                  {/* Admin (protected) */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <PrivateRoute>
                        <AdminDashboard />
                      </PrivateRoute>
                    }
                  />

                  {/* Fallback 404 */}
                  <Route path="*" element={<div>404 - Page Not Found</div>} />
                </Routes>
              </div>
              <Footer />
            </div>
          </Router>
        </LikesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;