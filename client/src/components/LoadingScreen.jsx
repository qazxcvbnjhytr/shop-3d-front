import React from "react";

export default function LoadingScreen() {
  // Цветовая палитра
  const colors = {
    primary: "#D55448",   // Терракотовый
    secondary: "#FFA577", // Оранжевый
    bg: "#F9F9FF",        // Светлый фон
    text: "#896E69"       // Тауп
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: colors.bg,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      zIndex: 1000,
      fontFamily: "sans-serif" // Или ваш основной шрифт
    }}>
      {/* Контейнер спиннера */}
      <div className="loader-container">
        <div className="spinner-ring ring-1" />
        <div className="spinner-ring ring-2" />
      </div>

      <p style={{
        marginTop: 25,
        color: colors.text,
        fontSize: "1.1rem",
        fontWeight: 500,
        letterSpacing: "0.05em",
        animation: "pulse 2s infinite ease-in-out"
      }}>
        Завантаження 3D каталогу...
      </p>

      <style>{`
        .loader-container {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .spinner-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 4px solid transparent;
        }

        /* Внешнее кольцо - Терракотовый */
        .ring-1 {
          border-top-color: ${colors.primary};
          border-left-color: ${colors.primary};
          animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
        }

        /* Внутреннее кольцо - Оранжевый */
        .ring-2 {
          width: 70%;
          height: 70%;
          top: 15%;
          left: 15%;
          border-bottom-color: ${colors.secondary};
          border-right-color: ${colors.secondary};
          animation: spin-reverse 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}