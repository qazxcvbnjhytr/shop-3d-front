import React, { createContext, useEffect, useContext, useState, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Отримання даних поточного юзера
  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await axiosInstance.get("/auth/me");
      setUser(res.data);
    } catch (err) {
      console.error("[AUTH ERROR]:", err.response?.data || err.message);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Класичний вхід
  const login = async (email, password) => {
    const res = await axiosInstance.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  // 🔥 Розумний Google Login (з підтримкою вводу телефону)
  const loginWithGoogle = async (googleToken, phone = null) => {
    try {
      const res = await axiosInstance.post("/auth/google", { 
        token: googleToken, 
        phone // Передаємо телефон, якщо бек його попросив
      });
      
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    } catch (err) {
      // Якщо бек кидає 409 — значить треба вивести поле для телефону
      if (err.response?.status === 409) {
        return { requiresPhone: true };
      }
      throw err;
    }
  };

  // 🔥 Функція для лайків (інтегрована в профіль)
  const toggleLike = async (productData) => {
    try {
      // Відправляємо на бек об'єкт товару
      const res = await axiosInstance.patch("/auth/likes", productData);
      
      // Сервер повертає оновлений масив лайків — міняємо його в юзері
      setUser(prev => ({
        ...prev,
        likes: res.data
      }));
      return res.data;
    } catch (err) {
      console.error("[LIKE ERROR]:", err.response?.data?.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      login, 
      loginWithGoogle, 
      logout, 
      toggleLike, // Тепер доступно всюди
      loading, 
      fetchUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);