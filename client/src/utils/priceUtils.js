/**
 * Обчислює ціни товару з урахуванням знижки.
 * @param {object} product - Об'єкт товару з полів price та discount.
 * @returns {object} Об'єкт, що містить: basePrice (число), discountPercent (число), finalPrice (рядок, округлений), hasDiscount (булеве).
 */
export const calculatePrice = (product) => {
    // Безпечне отримання числових значень
    const basePrice = Number(product?.price) || 0;
    const discountPercent = Number(product?.discount) || 0;
    
    // Перевіряємо, чи є реальна знижка
    const hasDiscount = discountPercent > 0 && discountPercent <= 100 && basePrice > 0;
    
    let finalPrice = basePrice;
    
    if (hasDiscount) {
        // Обчислення кінцевої ціни
        finalPrice = basePrice * (1 - discountPercent / 100);
    } 
    
    // Форматування: округлення до 2 знаків та виведення числа
    const formattedFinalPrice = finalPrice.toFixed(2); 
    const formattedBasePrice = basePrice.toFixed(2);

    return {
        basePrice: formattedBasePrice,
        discountPercent: discountPercent,
        finalPrice: formattedFinalPrice,
        hasDiscount: hasDiscount,
    };
};