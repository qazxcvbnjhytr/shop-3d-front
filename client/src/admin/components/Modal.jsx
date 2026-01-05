// client/src/admin/components/Modal.jsx
import React, { useEffect } from "react";

export default function Modal({ open, title, children, onClose, footer }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="card"
        style={{
          width: "min(980px, 100%)",
          maxHeight: "85vh",
          overflow: "auto",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="card-head">
          <div style={{ fontWeight: 900 }}>{title}</div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="card-body">{children}</div>
        {footer ? (
          <div className="card-head" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
