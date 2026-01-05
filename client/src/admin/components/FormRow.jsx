// client/src/admin/components/FormRow.jsx
import React from "react";

export default function FormRow({ label, children, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label ? <div className="label">{label}</div> : null}
      {children}
      {hint ? <div style={{ fontSize: 12, opacity: 0.65 }}>{hint}</div> : null}
    </div>
  );
}
