// client/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import ErrorBoundary from "./components/ErrorBoundary.jsx";

import { AuthProvider } from "./context/AuthContext.jsx";
import { LanguageProvider } from "./context/LanguageProvider.jsx";
import { CategoryProvider } from "./context/CategoryProvider.jsx";
import { BreadcrumbProvider } from "./context/BreadcrumbProvider.jsx";
import LikesProvider from "./context/LikesContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { CurrencyProvider } from "./context/CurrencyContext.jsx";

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
                                    <CartProvider>

                    <App />
                                    </CartProvider>

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
