// client/src/pages/account/AccountPage/UserHeader.jsx

import React from 'react';
// 🔥 ВИДАЛЕНО: import { getLocalizedText } from './localization'; 
import styles from '../UserLikes.module.css'; 

export default function UserHeader({ user,  }) {
    if (!user) return null;
    
    // 🔥 ФІКС: Якщо user.name є об'єктом, то використовуємо direct string (наприклад, user.name.ua).
    // Якщо ти не хочеш використовувати локалізацію, ми просто припускаємо, що це рядок.
    const userName = typeof user.name === 'string' ? user.name : user.name?.ua || user.email.split('@')[0];
    
    return (
        <section className={styles.userHeader}>
            <h1 className={styles.headerTitle}>
                Welcome, {userName}
            </h1>
            
            <p className={styles.headerInfo}>
                <strong>Email:</strong> {user.email}
            </p>
            <p className={styles.headerInfo}>
                <strong>Account ID:</strong> {user._id}
            </p>
            <p className={styles.headerInfo}>
                Статус: 
                {user.isOnline 
                    ? <span className={styles.statusOnline}> (Online)</span> 
                    : <span className={styles.statusOffline}> (Offline)</span>}
            </p>
        </section>
    );
}