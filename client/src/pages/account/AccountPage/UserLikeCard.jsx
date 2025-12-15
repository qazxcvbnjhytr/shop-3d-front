// client/src/pages/account/AccountPage/UserLikeCard.jsx (ФІНАЛЬНИЙ ВАРІАНТ)

import React from 'react';
import { Link } from 'react-router-dom'; 
import styles from './UserLikes.module.css'; 

export default function UserLikeCard({ like, toggleLike, language }) {
    
    // 1. 🔥 Більш надійна обробка назви
    const productName = (() => {
        if (typeof like.productName === 'string') return like.productName;
        
        if (like.productName && typeof like.productName === 'object') {
            return like.productName[language] || like.productName.ua || like.productName.en || 'Unknown Product';
        }
        
        return 'Unknown Product';
    })();
    
    // 2. 🔥 КРИТИЧНИЙ ФІКС: Формування SEO-friendly URL
    const productId = like.productId;
    // Припускаємо, що like.productCategory містить слаг ('pisi')
    // Якщо там ID, тобі потрібно буде запитати слаг у бекенду.
    const categorySlug = like.productCategory || 'default'; 
    
    // Схема: /catalog/:categorySlug/:productId
    const productLink = `/catalog/${categorySlug}/${productId}`;

    return (
        <div className={styles.likeCard}>
            {/* Огортаємо вміст у Link */}
            <Link to={productLink} className={styles.cardLink}>
                <h4 className={styles.cardTitle}>{productName}</h4>
                <img
                    src={like.productImage || "/placeholder.jpg"}
                    alt={productName}
                    className={styles.cardImage}
                />
            </Link>

            {/* Кнопка Unlike залишається окремою */}
            <button
                onClick={() => toggleLike(productId)} 
                className={styles.unlikeButton}
            >
                Unlike
            </button>
        </div>
    );
}