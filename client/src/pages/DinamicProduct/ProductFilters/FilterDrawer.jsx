import React, { useEffect } from "react";
import "./FilterDrawer.css";

export default function FilterDrawer({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;

    const onEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onEsc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fd-overlay" onMouseDown={onClose}>
      <div className="fd-panel" onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}