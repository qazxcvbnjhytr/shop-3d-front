// client/src/api/categoryService.js (ФІНАЛЬНА ВЕРСІЯ)

import axios from 'axios';

// ВИКОРИСТОВУЄМО ЗМІННУ ОТОЧЕННЯ, ЯКА МАЄ БУТИ: VITE_API_BASE_URL=http://localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// 🔥 ВИПРАВЛЕНО: Додаємо /api
const CATEGORIES_ENDPOINT = '/api/categories'; 

export const fetchCategoriesAPI = async (language) => {
    try {
        const response = await axios.get(`${API_BASE_URL}${CATEGORIES_ENDPOINT}`, {
            params: { lang: language }
        });

        // ... (інша логіка обробки, як ми домовились)
        return response.data;
    } catch (error) {
        // ... (обробка помилок)
        throw error;
    }
};