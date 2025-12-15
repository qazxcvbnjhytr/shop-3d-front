import React, { useEffect, useState, useContext, useCallback } from "react";
import axios from "axios";

import { AuthContext } from "@context/AuthContext";
import { LanguageContext } from "@context/LanguageContext";

// 🔥 ВИПРАВЛЕННЯ: AccountLayout правильно імпортує з підпапки
import AccountLayout from "./AccountPage/AccountLayout/AccountLayout"; 

// 🔥 ВИПРАВЛЕННЯ: Додаємо розширення .jsx для файлів, які лежать у папці AccountPage/
import UserHeader from "./AccountPage/UserHeader.jsx"; 
import UserLikes from "./AccountPage/UserLikes.jsx";

import styles from "./AccountPage.module.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AccountPage() {
    const { user, setUser } = useContext(AuthContext);
    const { language } = useContext(LanguageContext);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const authHeaders = useCallback(() => {
        if (!token) return {};
        return { Authorization: `Bearer ${token}` };
    }, [token]);

    const fetchUser = useCallback(async () => {
        if (!token) {
            setError("No token found. Please log in.");
            setLoading(false);
            return;
        }

        setError("");
        setLoading(true);

        try {
            const res = await axios.get(`${API_URL}/api/auth/me`, {
                headers: authHeaders(),
            });
            setUser(res.data);
        } catch (err) {
            console.error("API Error fetching user:", err);
            setError(err.response?.data?.message || "Failed to fetch user data");
        } finally {
            setLoading(false);
        }
    }, [token, authHeaders, setUser]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const toggleLike = useCallback(
        async (productId) => {
            if (!token) return;

            setError("");
            try {
                await axios.post(
                    `${API_URL}/api/likes`,
                    { productId },
                    { headers: authHeaders() }
                );

                await fetchUser();
            } catch (err) {
                console.error("Error toggling like:", err);
                setError(err.response?.data?.message || "Failed to update likes.");
            }
        },
        [token, authHeaders, fetchUser]
    );

    if (loading) return <AccountLayout loading styles={styles} />;
    if (error) return <AccountLayout error={error} styles={styles} />;
    if (!user)
        return (
            <AccountLayout
                message="Please log in to see your account."
                styles={styles}
            />
        );

    return (
        <AccountLayout styles={styles}>
            <UserHeader user={user} language={language} />

            {/* Сторінка лайків в стилі “Список бажань” */}
            <UserLikes
                likes={user.likes || []}
                toggleLike={toggleLike}
                language={language}
                apiUrl={API_URL}
                token={token}
            />
        </AccountLayout>
    );
}