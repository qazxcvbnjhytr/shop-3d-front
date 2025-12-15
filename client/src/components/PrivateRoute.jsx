// src/components/PrivateRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>; // поки перевіряється токен

  if (!user || user.role !== "admin") return <Navigate to="/" />; // якщо не адмін, редірект

  return children;
}
