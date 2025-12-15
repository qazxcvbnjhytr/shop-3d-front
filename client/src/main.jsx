// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageProvider";
import { CategoryProvider } from "./context/CategoryProvider";
import { BreadcrumbProvider } from "./context/BreadcrumbProvider";
import LikesProvider from "./context/LikesProvider.jsx";

// ✅ ДОДАЙ
import { CartProvider } from "./context/CartContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <CategoryProvider>
          <BreadcrumbProvider>
            <LikesProvider>
              {/* ✅ ОБГОРНУТИ APP */}
              <CartProvider>
                <App />
              </CartProvider>
            </LikesProvider>
          </BreadcrumbProvider>
        </CategoryProvider>
      </LanguageProvider>
    </AuthProvider>
  </React.StrictMode>
);
