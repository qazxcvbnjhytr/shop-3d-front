// client/src/pages/ProductPage/description/description.jsx
import React from "react";
import "./description.css"; // Якщо у вас є стилі, або створіть порожній файл

export default function Description({ product, language }) {
  if (!product) return null;

  // Визначаємо правильний ключ мови (ua або en)
  const langKey = language === "uk" ? "ua" : language;

  // Отримуємо опис
  const getDescriptionText = () => {
    const desc = product.description;
    
    // Якщо опис прийшов як рядок (старі товари)
    if (typeof desc === "string") return desc;
    
    // Якщо опис - це об'єкт {ua, en}
    if (desc && typeof desc === "object") {
      return desc[langKey] || desc.ua || desc.en || "";
    }
    
    return "";
  };

  const text = getDescriptionText();

  // Характеристики (якщо потрібно відображати тут)


  return (
    <div className="product-description">
      {/* Текстовий опис */}
      <div className="product-description__text-block">
        <h3 className="product-description__title">
          {langKey === "en" ? "Description" : "Опис"}
        </h3>
        {text ? (
          <p className="product-description__paragraph">{text}</p>
        ) : (
          <p className="product-description__empty">
            {langKey === "en" ? "No description available." : "Опис відсутній."}
          </p>
        )}
      </div>
      </div>

  );
}