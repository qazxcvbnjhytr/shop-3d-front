// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { AuthProvider } from "./context/AuthContext.jsx";
import { LanguageProvider } from "./context/LanguageProvider";
import { CategoryProvider } from "./context/CategoryProvider";
import { BreadcrumbProvider } from "./context/BreadcrumbProvider";
import LikesProvider from "./context/LikesProvider.jsx";
import { CurrencyProvider } from "./context/CurrencyContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";

import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <CategoryProvider>
            <BreadcrumbProvider>
              <LikesProvider>
                <CartProvider>
                  <CurrencyProvider>
                    <App />
                  </CurrencyProvider>
                </CartProvider>
              </LikesProvider>
            </BreadcrumbProvider>
          </CategoryProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
