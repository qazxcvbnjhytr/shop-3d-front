import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { LanguageContext } from "../../context/LanguageContext";
import { 
  FaPlus, FaMinus, FaCopy, FaTelegramPlane, 
  FaInstagram, FaWhatsapp, FaArrowRight 
} from "react-icons/fa";
import "./Contacts.css";

const Contacts = () => {
  const { language, translations, loading } = useContext(LanguageContext);
  const [activeIndex, setActiveIndex] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const langKey = useMemo(() => {
    const raw = String(language || "").toLowerCase();
    return raw === "uk" ? "ua" : (raw || "ua");
  }, [language]);

  const t = useMemo(() => {
    const data = translations?.[langKey] || translations;
    return data?.contacts || {};
  }, [translations, langKey]);

  const faqData = useMemo(() => {
    const faq = t?.faq || {};
    return Object.keys(faq)
      .filter(key => key.startsWith('q'))
      .map(key => {
        const num = key.replace('q', '');
        return { question: faq[`q${num}`], answer: faq[`a${num}`] };
      })
      .filter(x => x.question && x.answer);
  }, [t]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Тут можна додати кастомний Notification
  };

  const toggleFAQ = useCallback((index) => {
    setActiveIndex(prev => (prev === index ? null : index));
  }, []);

  if (loading) return <div className="c-loading-screen">MebliHub</div>;

  return (
    <div className="contacts-page has-grain">
      <div className="parallax-bg" style={{ transform: `translateY(${scrollY * 0.12}px)` }} />
      
      <div className="contacts-container">
        {/* HEADER SECTION */}
        <header className="contacts-header fade-in">
          <div className="header-meta">MebliHub / Technical Support</div>
          <h1 className="arch-title">{t.heroTitle || "Contact"}</h1>
          <div className="title-row">
            <div className="title-underline"></div>
            <div className="coordinates">50.4501° N, 30.5234° E</div>
          </div>
        </header>

        {/* MAIN INFO SECTION */}
        <section className="main-info-layout">
          <div className="info-main-column">
            <div className="contact-huge-item">
              <label>Direct Email</label>
              <div className="interactive-text" onClick={() => copyToClipboard(t.emailText)}>
                {t.emailText || "hello@meblihub.com"} <FaCopy className="copy-icon" />
              </div>
            </div>
            
            <div className="contact-huge-item">
              <label>Customer Support</label>
              <div className="phone-wrapper">
                 <div className="status-dot"></div>
                 <a href={`tel:${t.phoneText}`}>{t.phoneText || "+38 (000) 000-00-00"}</a>
              </div>
            </div>

            <div className="social-links-grid">
              <a href="#" className="social-box"><FaTelegramPlane /> <span>Telegram</span></a>
              <a href="#" className="social-box"><FaInstagram /> <span>Instagram</span></a>
              <a href="#" className="social-box"><FaWhatsapp /> <span>WhatsApp</span></a>
            </div>
          </div>

          <div className="info-side-column">
            <div className="work-hours-card">
              <h3>{langKey === 'ua' ? 'Графік роботи' : 'Showroom Hours'}</h3>
              <ul className="hours-list">
                <li><span>Mon — Fri</span> <span>09:00 — 20:00</span></li>
                <li><span>Sat</span> <span>10:00 — 18:00</span></li>
                <li className="closed-day"><span>Sun</span> <span>{langKey === 'ua' ? 'Вихідний' : 'Closed'}</span></li>
              </ul>
              <div className="location-note">
                <strong>{t.addressTitle || "Office"}:</strong>
                <p>{t.addressText || "Kyiv, Ukraine"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* FORM & FAQ SECTION */}
        <div className="form-faq-layout">
          <section className="form-section">
            <h2 className="section-title">{t.formTitle || "Inquiry"}</h2>
            <form className="arch-form" onSubmit={(e) => { e.preventDefault(); setFormSubmitted(true); }}>
              <div className="input-row">
                <input type="text" placeholder={t.formNamePlaceholder || "Name"} required />
                <input type="email" placeholder={t.formEmailPlaceholder || "Email"} required />
              </div>
              <textarea placeholder={t.formMessagePlaceholder || "Message"} required />
              <button type="submit" className="submit-btn">
                {formSubmitted ? (t.successMsg || "Sent") : (t.formSubmit || "Send Message")}
                <FaArrowRight />
              </button>
            </form>
          </section>

          <section className="faq-section">
            <h2 className="section-title">{t.faqTitle || "FAQ"}</h2>
            <div className="faq-list">
              {faqData.map((item, index) => (
                <div key={index} className={`faq-item ${activeIndex === index ? "active" : ""}`} onClick={() => toggleFAQ(index)}>
                  <div className="faq-trigger">
                    <span>{item.question}</span>
                    <div className="faq-icon-box">{activeIndex === index ? <FaMinus /> : <FaPlus />}</div>
                  </div>
                  <div className="faq-content-wrap">
                    <div className="faq-content-inner">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Contacts;