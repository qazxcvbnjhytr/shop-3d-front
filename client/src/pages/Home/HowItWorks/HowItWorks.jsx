import React from "react";
import { Link } from "react-router-dom";
import { FaCube, FaMobileAlt, FaCheckCircle } from "react-icons/fa"; // Використовуємо іконки
import "./HowItWorks.css";

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      icon: <FaCube />,
      title: "Оберіть модель",
      description: "Знайдіть у каталозі меблі з позначкою 3D. Ми маємо сотні моделей."
    },
    {
      id: 2,
      icon: <FaMobileAlt />,
      title: "Приміряйте вдома",
      description: "Натисніть кнопку AR та наведіть камеру телефону на кімнату. Меблі з'являться у реальному розмірі."
    },
    {
      id: 3,
      icon: <FaCheckCircle />,
      title: "Приймайте рішення",
      description: "Більше жодних сумнівів щодо розміру чи кольору. Купуйте впевнено."
    }
  ];

  return (
    <section className="how-it-works">
      <div className="hiw-container">
        <h2 className="hiw-title">Як працює 3D-примірка?</h2>
        <p className="hiw-subtitle">Технології майбутнього вже у вашому домі</p>

        <div className="hiw-steps">
          {steps.map((step) => (
            <div key={step.id} className="hiw-card">
              <div className="icon-wrapper">
                {step.icon}
                <span className="step-number">{step.id}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>

        <div className="hiw-action">
          <Link to="/catalog" className="btn-try-3d">
            Спробувати 3D зараз
          </Link>
        </div>
      </div>
    </section>
  );
}