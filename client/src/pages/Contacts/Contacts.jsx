import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { LanguageContext } from "../../context/LanguageContext";
import { FaPlus, FaMinus, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import "../Contacts/Contacts.css";

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

  // ✅ Нормалізація мови (EN/en/ua/uk)
  const langKey = useMemo(() => {
    const raw = String(language || "").toLowerCase();
    if (raw === "uk") return "ua";
    if (raw === "ua" || raw === "en") return raw;
    return raw || "ua";
  }, [language]);

  /**
   * ✅ Головний фікс:
   * translations може бути:
   *  A) { ua: {...}, en: {...} }
   *  B) вже "current translations object" => { header:..., contacts:... }
   */
  const currentTranslations = useMemo(() => {
    if (!translations) return {};
    const byLang =
      translations?.[langKey] ||
      translations?.[String(language || "").toLowerCase()] ||
      translations?.[String(language || "").toUpperCase()] ||
      null;

    return byLang || translations; // fallback якщо translations вже current-object
  }, [translations, langKey, language]);

  const t = useMemo(() => {
    return currentTranslations?.contacts || {};
  }, [currentTranslations]);

  const faqData = useMemo(() => {
    const faq = t?.faq || {};
    return [
      { question: faq.q1, answer: faq.a1 },
      { question: faq.q2, answer: faq.a2 },
      { question: faq.q3, answer: faq.a3 },
      { question: faq.q4, answer: faq.a4 },
      { question: faq.q5, answer: faq.a5 },
    ].filter((x) => x.question && x.answer);
  }, [t]);

  const toggleFAQ = useCallback((index) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 3000);
    setFormData({ name: "", email: "", message: "" });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="contacts-page-container">
      <div className="parallax-bg" style={{ transform: `translateY(${scrollY * 0.1}px)` }} />

      <section className="contact-info fade-in-up">
        <h1>{t.heroTitle || "Contact Us"}</h1>

        <div className="info-grid">
          <div className="info-card">
            <FaMapMarkerAlt className="info-icon" />
            <h3>{t.addressTitle || "Address"}</h3>
            <p>{t.addressText || ""}</p>
          </div>

          <div className="info-card">
            <FaPhoneAlt className="info-icon" />
            <h3>{t.phoneTitle || "Phone"}</h3>
            <p>{t.phoneText || ""}</p>
          </div>

          <div className="info-card">
            <FaEnvelope className="info-icon" />
            <h3>{t.emailTitle || "Email"}</h3>
            <p>{t.emailText || ""}</p>
          </div>
        </div>
      </section>

      <section className="contact-form-section fade-in-up delay-100">
        <h2>{t.formTitle || "Write to Us"}</h2>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder={t.formNamePlaceholder || "Your name"}
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder={t.formEmailPlaceholder || "Your email"}
            value={formData.email}
            onChange={handleChange}
            required
          />

          <textarea
            name="message"
            placeholder={t.formMessagePlaceholder || "Your message"}
            value={formData.message}
            onChange={handleChange}
            required
          />

          <button type="submit">{t.formSubmit || "Send"}</button>
          {formSubmitted && <p className="success-msg">{t.successMsg || "Message sent!"}</p>}
        </form>
      </section>

      <section className="faq-section fade-in-up delay-200">
        <h2>{t.faqTitle || "FAQ"}</h2>

        {/* якщо FAQ порожній — покажемо текст, щоб було очевидно */}
        {!faqData.length ? (
          <div style={{ textAlign: "center", opacity: 0.75 }}>
            FAQ data is empty (check translations structure / keys).
          </div>
        ) : (
          <div className="faq-grid">
            {faqData.map((item, index) => {
              const isActive = activeIndex === index;

              return (
                <div
                  key={index}
                  className={`faq-card ${isActive ? "active" : ""}`}
                  onClick={() => toggleFAQ(index)}
                >
                  <div className="faq-question">
                    <span>{item.question}</span>
                    <div className="faq-icon">{isActive ? <FaMinus /> : <FaPlus />}</div>
                  </div>

                  {/* ✅ wrapper як у твоєму CSS */}
                  <div className="faq-answer-wrapper">
                    <div className="faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Contacts;
