import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaFacebookF,
  FaInstagram,
  FaTelegramPlane,
} from "react-icons/fa";
import Logo from "../Logo/Logo";
import { useTranslation } from "../../hooks/useTranslation";

export default function Footer() {
  const { t, loading, language } = useTranslation();

  if (loading || !t) return null;

  const f = t.footer || {};
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* Колонна 1: Бренд та Підписка */}
        <div className="footer-col brand-section">
          <Logo title="MebliHub" />
          <p className="footer-slogan">{f.mishura || "Створюємо простір для життя."}</p>
          
          <div className="footer-newsletter">
            <h4 className="footer-small-title">{language === 'ua' ? 'Підписка' : 'Newsletter'}</h4>
            <form className="subscribe-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="E-mail" />
              <button type="submit">→</button>
            </form>
          </div>
        </div>

        {/* Колонна 2: Навігація */}
        <div className="footer-col">
          <h4 className="footer-small-title">{language === 'ua' ? 'Каталог' : 'Catalog'}</h4>
          <nav className="footer-nav">
            <ul>
              <li><Link to="/catalog/sofas">{language === 'ua' ? 'Дивани' : 'Sofas'}</Link></li>
              <li><Link to="/catalog/tables">{language === 'ua' ? 'Столи' : 'Tables'}</Link></li>
              <li><Link to="/catalog/chairs">{language === 'ua' ? 'Стільці' : 'Chairs'}</Link></li>
              <li><Link to="/collections">{language === 'ua' ? 'Колекції' : 'Collections'}</Link></li>
            </ul>
          </nav>
        </div>

        {/* Колонна 3: Сервіс та Допомога */}
        <div className="footer-col">
          <h4 className="footer-small-title">{language === 'ua' ? 'Сервіс' : 'Service'}</h4>
          <nav className="footer-nav">
            <ul>
              <li><Link to="/delivery">{language === 'ua' ? 'Доставка та оплата' : 'Delivery'}</Link></li>
              <li><Link to="/warranty">{language === 'ua' ? 'Гарантія' : 'Warranty'}</Link></li>
              <li><Link to="/designers">{language === 'ua' ? 'Дизайнерам' : 'For Designers'}</Link></li>
              <li><Link to="/about">{language === 'ua' ? 'Про компанію' : 'About'}</Link></li>
            </ul>
          </nav>
        </div>

        {/* Колонна 4: Контакти */}
        <div className="footer-col contacts-section">
          <h4 className="footer-small-title">{language === 'ua' ? 'Контакти' : 'Contacts'}</h4>
          <div className="footer-contacts">
            <a href="tel:+380441234567" className="contact-link"><FaPhoneAlt /> +38 (044) 123-45-67</a>
            <a href="mailto:info@meblihub.com" className="contact-link"><FaEnvelope /> info@meblihub.com</a>
            <p className="contact-address"><FaMapMarkerAlt /> {f.address || 'Київ, вул. Архітектора, 12'}</p>
          </div>
          <div className="footer-social">
            <a href="#"><FaFacebookF /></a>
            <a href="#"><FaInstagram /></a>
            <a href="#"><FaTelegramPlane /></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>© {year} MebliHub. {f.rights || "Всі права захищені."}</p>
          <div className="footer-legal-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}