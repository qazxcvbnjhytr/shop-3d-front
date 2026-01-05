import React from "react";
import { Link } from "react-router-dom";
import "./HomeHero.css";

export default function HomeHero() {
  return (
    <section className="hero">
      <div className="hero__left">
        <div className="hero__pill">Нова колекція 2025</div>
        <h1 className="hero__h1">Знайдіть свої ідеальні меблі</h1>
        <p className="hero__sub">
          Переглядайте товари, додавайте в обране та тестуйте в 3D — швидко і зручно.
        </p>

        <div className="hero__benefits">
          <div className="hero__benefit">3D перегляд</div>
          <div className="hero__benefit">Доставка по Україні</div>
          <div className="hero__benefit">Підтримка 24/7</div>
          <div className="hero__benefit">Гарантія</div>
        </div>

        <div className="hero__cta">
          <Link className="hero__btn hero__btn--primary" to="/catalog">До каталогу</Link>
          <Link className="hero__btn hero__btn--ghost" to="/catalog">Переглянути в 3D</Link>
          <Link className="hero__btn hero__btn--ghost" to="/news">Акції</Link>
        </div>
      </div>

      <div className="hero__right">
        <div className="hero__media">
          <div className="hero__chip">Хіт ціна</div>
          <img className="hero__img" src="/Home/meblihub_svoi.png" alt="MebliHub" />
        </div>
      </div>
    </section>
  );
}
