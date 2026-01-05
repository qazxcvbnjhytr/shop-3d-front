// client/src/admin/components/Toast.jsx
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((type, text) => {
    const id = `${Date.now()}-${Math.random()}`;
    setItems((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  const api = useMemo(() => ({
    success: (t) => push("success", t),
    error: (t) => push("error", t),
    info: (t) => push("info", t),
  }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div style={{ position: "fixed", right: 14, bottom: 14, zIndex: 99999, display: "grid", gap: 10 }}>
        {items.map((t) => (
          <div
            key={t.id}
            className="card"
            style={{
              width: 360,
              borderColor:
                t.type === "success"
                  ? "rgba(109,255,182,0.25)"
                  : t.type === "error"
                  ? "rgba(255,107,107,0.25)"
                  : "rgba(255,255,255,0.12)",
            }}
          >
            <div className="card-body" style={{ padding: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>
                {t.type === "success" ? "OK" : t.type === "error" ? "Error" : "Info"}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{t.text}</div>
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
