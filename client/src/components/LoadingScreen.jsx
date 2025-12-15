import React from "react";

export default function LoadingScreen() {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "#1a1a1a",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "#fff",
      flexDirection: "column",
      zIndex: 1000
    }}>
      <div className="spinner" style={{
        border: "6px solid #f3f3f3",
        borderTop: "6px solid #3498db",
        borderRadius: "50%",
        width: 60,
        height: 60,
        animation: "spin 1s linear infinite"
      }} />
      <p style={{marginTop: 20}}>Завантаження 3D каталогу...</p>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>
    </div>
  )
}
