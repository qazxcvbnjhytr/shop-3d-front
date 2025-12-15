import React, { useEffect, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import {
  FaCube,
  FaSeedling,
  FaPalette,
  FaRocket
} from "react-icons/fa";
import "./About.css";

const About = () => {
  const { t, loading } = useTranslation();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading || !t?.about) {
    return null; // або Loader
  }

  const a = t.about;

  return (
    <div className="about-page-container">
      {/* Паралакс */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`floating-shape floating-shape-${i + 1} parallax`}
          style={{
            transform: `translateY(${scrollY * (0.05 + i * 0.02)}px)`
          }}
        />
      ))}

      {/* HERO */}
      <section className="about-hero fade-in-up delay-100">
        <h1>{a.heroTitle}</h1>
        {a.heroText.map((p, i) => (
          <p key={i} className={`fade-in-up delay-${200 + i * 60}`}>
            {p}
          </p>
        ))}
      </section>

      {/* FEATURES */}
      <section className="features-grid fade-in-up delay-500">
        {a.features.map((f, i) => (
          <div
            key={i}
            className={`about-content-card fade-in-up delay-${550 + i * 100}`}
          >
            <div className="feature-icon">
              {f.icon === "cube" && <FaCube />}
              {f.icon === "seedling" && <FaSeedling />}
              {f.icon === "palette" && <FaPalette />}
              {f.icon === "rocket" && <FaRocket />}
            </div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-text">{f.text}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="about-cta fade-in-up delay-1200">
        <h2>{a.ctaTitle}</h2>
        <p>{a.ctaText}</p>
      </section>
    </div>
  );
};

export default About;
