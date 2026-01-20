import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { FaCube, FaSeedling, FaPalette, FaRocket } from "react-icons/fa";
import "./About.css";

const About = () => {
  const { t, loading, language } = useTranslation();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const lang = useMemo(() => language === "uk" ? "ua" : (language || "ua"), [language]);

  if (loading || !t?.about) {
    return <div className="c-loading">MebliHub / HQ</div>;
  }

  const a = t.about;

  return (
    <div className="about-page has-grain">
      {/* BACKGROUND DECOR */}
      <div className="parallax-bg" style={{ transform: `translateY(${scrollY * 0.15}px)` }} />
      <div className="arch-lines"></div>

      <div className="about-container">
        {/* HERO SECTION */}
        <header className="about-hero">
          <div className="header-meta">MebliHub / Identity</div>
          <h1 className="arch-title">{a.heroTitle || "Philosophy"}</h1>
          <div className="hero-grid">
            <div className="hero-empty"></div>
            <div className="hero-content">
              {Array.isArray(a.heroText) ? a.heroText.map((p, i) => (
                <p key={i} className="hero-paragraph">{p}</p>
              )) : <p className="hero-paragraph">{a.heroText}</p>}
            </div>
          </div>
        </header>

        {/* MISSION SECTION (Creative Element) */}
        <section className="philosophy-block">
          <div className="ph-number">01</div>
          <div className="ph-text-wrap">
             <h2 className="ph-title">{lang === 'ua' ? 'Естетика функціональності' : 'Aesthetics of Function'}</h2>
             <p className="ph-sub">Digital-first approach to interior design.</p>
          </div>
          <div className="ph-accent-box"></div>
        </section>

        {/* FEATURES GRID */}
        <section className="features-section">
          <div className="section-meta">Core Values / 02</div>
          <div className="features-grid">
            {a.features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon-wrap">
                  {f.icon === "cube" && <FaCube />}
                  {f.icon === "seedling" && <FaSeedling />}
                  {f.icon === "palette" && <FaPalette />}
                  {f.icon === "rocket" && <FaRocket />}
                </div>
                <h3 className="feature-name">{f.title}</h3>
                <p className="feature-desc">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA / MANIFESTO */}
        <section className="about-manifesto">
          <div className="manifesto-inner">
            <h2 className="manifesto-title">{a.ctaTitle}</h2>
            <p className="manifesto-text">{a.ctaText}</p>
            <div className="manifesto-signature">MebliHub Team / 2024</div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;