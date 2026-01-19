// client/src/pages/AccountPage.jsx
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

import { AuthContext } from "@context/AuthContext";
import { LanguageContext } from "@context/LanguageContext";

import AccountLayout from "./AccountPage/AccountLayout/AccountLayout";
import UserHeader from "./AccountPage/UserHeader.jsx";
import UserLikes from "./AccountPage/UserLikes.jsx";

import styles from "./AccountPage.module.css";

// ✅ env-first (без localhost fallback)
const RAW_API = import.meta.env.VITE_API_URL;
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";

const normalizeOrigin = (url) => String(url || "").replace(/\/+$/, "");
const normalizePrefix = (p) => {
  const s = String(p || "/api").trim();
  if (!s) return "/api";
  return s.startsWith("/") ? s.replace(/\/+$/, "") : `/${s.replace(/\/+$/, "")}`;
};

if (!RAW_API) {
  throw new Error("Missing VITE_API_URL in client/.env(.local)");
}

const API_BASE = `${normalizeOrigin(RAW_API)}${normalizePrefix(API_PREFIX)}`; 
const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("jwt") ||
  "";

export default function AccountPage() {
  const { user, setUser } = useContext(AuthContext) || {};
  const { language } = useContext(LanguageContext) || { language: "ua" };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = useMemo(() => getToken(), []);

  const authHeaders = useCallback(() => {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, []);

  const fetchUser = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setError("No token found. Please log in.");
      setLoading(false);
      return;
    }

    setError("");
    setLoading(true);

    try {
      // ✅ /api вже в API_BASE
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: authHeaders(),
        withCredentials: true,
        timeout: 20000,
      });

      setUser?.(res.data);
    } catch (err) {
      console.error("API Error fetching user:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, setUser]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const toggleLike = useCallback(
    async (productId) => {
      const t = getToken();
      if (!t) return;

      setError("");

      try {
        // ✅ /api вже в API_BASE
        await axios.post(
          `${API_BASE}/likes`,
          { productId: String(productId) },
          { headers: authHeaders(), withCredentials: true, timeout: 20000 }
        );

        await fetchUser();
      } catch (err) {
        console.error("Error toggling like:", err);
        setError(err?.response?.data?.message || err?.message || "Failed to update likes.");
      }
    },
    [authHeaders, fetchUser]
  );

  if (loading) return <AccountLayout loading styles={styles} />;
  if (error) return <AccountLayout error={error} styles={styles} />;

  if (!user) {
    return (
      <AccountLayout message="Please log in to see your account." styles={styles} />
    );
  }

  return (
    <AccountLayout styles={styles}>
      <UserHeader user={user} language={language} />

      <UserLikes
        likes={user?.likes || []}
        toggleLike={toggleLike}
        language={language}
        apiUrl={normalizeOrigin(RAW_API)} // ✅ для картинок: origin без /api
        token={token}
      />
    </AccountLayout>
  );
}
