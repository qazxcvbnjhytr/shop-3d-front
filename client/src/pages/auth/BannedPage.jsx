import React from "react";
import { Link } from "react-router-dom";
import { FaBan } from "react-icons/fa"; // Якщо є react-icons, або використай lucide-react

export default function BannedPage() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <FaBan size={80} color="#dc2626" />
        <h1 style={styles.title}>ACCESS DENIED</h1>
        <h2 style={styles.subtitle}>Ваш акаунт заблоковано.</h2>
        
        <p style={styles.text}>
          Адміністрація вирішила, що вам тут не раді. 
          Можливо, ви порушили правила, або просто поводили себе погано.
        </p>

        <div style={styles.infoBox}>
          <p>Status: <span style={{color: '#dc2626', fontWeight: 'bold'}}>BANNED</span></p>
        </div>

        <p style={styles.footer}>
          Якщо ви вважаєте, що це помилка (ага, звісно), <br />
          можете написати нам на пошту, але ми не обіцяємо відповісти.
        </p>

        <Link to="/" style={styles.button}>
          На головну (як гість)
        </Link>
      </div>
    </div>
  );
}

// Прості стилі прямо тут, щоб не створювати CSS файл
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2", // світло-червоний фон
    fontFamily: "Arial, sans-serif",
  },
  card: {
    maxWidth: "500px",
    padding: "40px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    border: "2px solid #fee2e2"
  },
  title: {
    fontSize: "32px",
    color: "#991b1b",
    margin: 0,
    fontWeight: "900",
    letterSpacing: "2px"
  },
  subtitle: {
    fontSize: "20px",
    color: "#374151",
    margin: 0,
  },
  text: {
    color: "#6b7280",
    lineHeight: "1.6",
  },
  infoBox: {
    background: "#f3f4f6",
    padding: "10px 20px",
    borderRadius: "8px",
    width: "100%",
    border: "1px solid #e5e7eb"
  },
  footer: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "10px"
  },
  button: {
    marginTop: "20px",
    padding: "12px 24px",
    backgroundColor: "#111827",
    color: "white",
    textDecoration: "none",
    borderRadius: "6px",
    fontWeight: "600",
    transition: "0.2s"
  }
};