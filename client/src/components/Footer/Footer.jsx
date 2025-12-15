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
  const { t, loading } = useTranslation();

  if (loading || !t) return null;

  const header = t.header || {};
  const footer = t.footer || {};

  // Нормалізовані ключі (однаково для UA/EN)
  const navTitle = footer.navigationTitle || "Navigation";
  const contactsTitle = footer.contactsTitle || "Contacts";
  const slogan = footer.mishura || "";
  const rights = footer.rights || "All rights reserved.";

  const emailText = footer.emailText || "info@meblihub.com";
  const phoneText = footer.phoneText || "+38 (044) 123-45-67";
  const address = footer.address || "";

  const navItems = [
    { to: "/catalog", label: header.catalog || "Catalog" },
    { to: "/where-to-buy", label: header.whereToBuy || "Where to Buy" },
    { to: "/news", label: header.news || "News" },
    { to: "/contacts", label: header.contacts || "Contacts" },
    { to: "/about", label: header.about || "About" },
    { to: "/request-price", label: header.requestPrice || "Request Price" },
    { to: "/download-catalog", label: header.downloadCatalog || "Download Catalog" },
  ];

  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Column 1 */}
        <div className="footer-col footer-brand">
          <div className="footer-logo-wrapper">
            <Logo title="MebliHub" />
          </div>

          {slogan && <p className="footer-slogan">{slogan}</p>}

          <div className="footer-social" aria-label="Social links">
            <a href="https://facebook.com/meblihub" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="https://instagram.com/meblihub" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://t.me/meblihub" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
              <FaTelegramPlane />
            </a>
          </div>
        </div>

        {/* Column 2 */}
        <div className="footer-col footer-nav-col">
          <h3>{navTitle}</h3>
          <nav className="footer-nav" aria-label={navTitle}>
            <ul>
              {navItems.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Column 3 */}
        <div className="footer-col footer-contacts-col">
          <h3>{contactsTitle}</h3>

          <div className="footer-contacts">
            <div className="contact-item">
              <FaEnvelope className="icon" />
              <a href={`mailto:${emailText}`}>{emailText}</a>
            </div>

            <div className="contact-item">
              <FaPhoneAlt className="icon" />
              <a href={`tel:${phoneText.replace(/[^\d+]/g, "")}`}>{phoneText}</a>
            </div>

            {address && (
              <div className="contact-item">
                <FaMapMarkerAlt className="icon" />
                <span>{address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <span>© {year} MebliHub. {rights}</span>
        </div>
      </div>
    </footer>
  );
}
