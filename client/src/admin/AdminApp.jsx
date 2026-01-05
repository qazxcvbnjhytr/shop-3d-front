import React from "react";
import AdminRoutes from "./AdminRoutes.jsx";
import { ToastProvider } from "./components/Toast.jsx";

export default function AdminApp() {
  return (
    <ToastProvider>
      <AdminRoutes />
    </ToastProvider>
  );
}
