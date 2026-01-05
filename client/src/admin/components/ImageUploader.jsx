// client/src/admin/components/ImageUploader.jsx
import React, { useMemo } from "react";

export default function ImageUploader({ label, multiple = false, value, onChange, hint }) {
  const previews = useMemo(() => {
    if (!value) return [];
    if (multiple) return Array.isArray(value) ? value : [];
    return value ? [value] : [];
  }, [value, multiple]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {label ? <div className="label">{label}</div> : null}

      <input
        className="input"
        type="file"
        multiple={multiple}
        accept="image/*"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (!multiple) onChange?.(files[0] || null);
          else onChange?.(files);
        }}
      />

      {hint ? <div style={{ fontSize: 12, opacity: 0.65 }}>{hint}</div> : null}

      {!!previews.length && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {previews.map((p, idx) => (
            <div
              key={`${idx}-${String(p)}`}
              style={{
                width: 96,
                height: 76,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
              }}
              title={String(p)}
            >
              {typeof p === "string" ? (
                <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ fontSize: 12, opacity: 0.75 }}>Selected</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
