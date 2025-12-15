// client/src/components/Logo/Logo.jsx - КРЕАТИВНИЙ ВАРІАНТ

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChair } from 'react-icons/fa'; // Використовуємо іконку крісла для меблевої теми
import './Logo.css';

/**
 * Компонент логотипу з елегантним стилем та іконкою.
 * @param {string} title Назва сайту (наприклад, "MebliHub").
 */
export default function Logo({ title = "MebliHub" }) {
    const navigate = useNavigate();
    
    // Припускаємо, що назва має дві частини, які ми можемо стилізувати окремо:
    // MebliHub -> [Mebli] + [Hub]
    const titlePart1 = title.slice(0, 5); 
    const titlePart2 = title.slice(5);

    return (
        <div className="site-logo-container" onClick={() => navigate('/')}>
            <div className="logo-icon-wrapper">
                {/* Стилізована іконка крісла/меблів */}
                <FaChair className="logo-icon" /> 
            </div>
            
            <h1 className="logo-title">
                {/* Перша частина (насичена, можливо, товстіша) */}
                <span className="title-bold">{titlePart1}</span>
                {/* Друга частина (легка, акцентна) */}
                <span className="title-light">{titlePart2}</span>
            </h1>
        </div>
    );
}