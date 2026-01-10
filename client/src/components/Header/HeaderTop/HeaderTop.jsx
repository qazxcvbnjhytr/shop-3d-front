import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "@context/LanguageContext";

// Іконки
import { FaHeart, FaShoppingCart, FaPhone } from "react-icons/fa"; 

// Контексти для лічильників
import { useLikes } from "../../../context/LikesContext.jsx"; 
import { useCart } from "../../../context/CartContext.jsx"; 

// Компоненти
import Logo from "@components/Logo/Logo";
import UserMenu from "@components/UserMenu/UserMenu";
import LikeDropdown from "../LikeDropdown/LikeDropdown";
import HeaderSearch from "../HeaderSearch/HeaderSearch.jsx"; 

import "./HeaderTop.css";

export default function HeaderTop({ title = "MebliHub" }) {
    const { language, toggleLanguage, translations, loading } =
        useContext(LanguageContext);
    
    const { likedProducts = [] } = useLikes(); 
    const { totalItems: cartTotalItems = 0 } = useCart(); 

    const texts = translations?.header || {};

    const [likesOpen, setLikesOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false); 
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 720);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    if (loading) return null;


    const likeCount = likedProducts.length;
    const cartCount = cartTotalItems; 

    return (
        <div className="header-top">
            <div className="header-top-left">
                <Logo title={title} />
            </div>

            <div className="header-top-center">
                <HeaderSearch language={language} />
            </div>

            {/* КОНТРОЛИ: Телефон, Лайки, Кошик, Акаунт */}
            <div className="header-top-right">
                
                {/* 📞 ТЕЛЕФОН: На мобільному - іконка, на десктопі - повний номер */}
                {isMobile ? (
                    <a 
                        className="header-icon header-icon--phone-mobile" 
                        href="tel:+380000000000"
                        aria-label="Зателефонувати нам"
                    >
                        <FaPhone className="header-icon__svg" />
                    </a>
                ) : (
                    <a className="header-phone" href="tel:+380000000000">
                        +38 (000) 000-00-00
                    </a>
                )}

                {/* ✅ Wishlist (з лічильником) */}
                <div
                    className="header-like-wrap"
                    onMouseEnter={() => !isMobile && setLikesOpen(true)}
                    onMouseLeave={() => !isMobile && setLikesOpen(false)}
                >
                    <button
                        type="button"
                        className="header-icon header-icon--wishlist"
                        aria-label="Wishlist"
                        aria-haspopup="menu"
                        aria-expanded={likesOpen}
                        onClick={() => isMobile && setLikesOpen((p) => !p)}
                    >
                        <FaHeart className="header-icon__svg" />
                        
                        {/* ЛІЧИЛЬНИК ЛАЙКІВ */}
                        {likeCount > 0 && (
                           <span className="header-icon__badge">{likeCount}</span>
                        )}
                        
                    </button>

                    <LikeDropdown
                        open={likesOpen}
                        onClose={() => setLikesOpen(false)}
                    />
                </div>

                {/* 🛒 Shopping Cart (З ЛІЧИЛЬНИКОМ) */}
                <div
                    className="header-cart-wrap"
                    onMouseEnter={() => !isMobile && setCartOpen(true)}
                    onMouseLeave={() => !isMobile && setCartOpen(false)}
                >
                    <Link 
                        className="header-icon header-icon--cart" 
                        to="/shopping-cart"
                        aria-label="Shopping Cart"
                        aria-haspopup="menu"
                        aria-expanded={cartOpen}
                    >
                        <FaShoppingCart className="header-icon__svg" /> 
                        
                        {/* ЛІЧИЛЬНИК КОШИКА */}
                        {cartCount > 0 && (
                           <span className="header-icon__badge">{cartCount}</span>
                        )}
                        
                    </Link>
                </div>

                {/* 👤 UserMenu (Акаунт) */}
                <UserMenu
                    texts={texts}
                    language={language}
                    toggleLanguage={toggleLanguage}
                />
            </div>
        </div>
    );
}