import React, { useMemo } from "react";
import "./Articule.css";

export default function Articule({
  skuFull = "",
  tailParts = 2,                // 2 => STR-MNT, 1 => MNT
  label = "Артикул",
  className = "",
}) {
  const { full, short } = useMemo(() => {
    const full = String(skuFull || "").trim();
    if (!full) return { full: "", short: "" };

    const parts = full
      .split(/[-_\s]+/)
      .map((x) => x.trim())
      .filter(Boolean);

    const n = Number(tailParts);
    const take = Number.isFinite(n) ? Math.max(1, Math.min(6, n)) : 2;

    const short = parts.length >= take ? parts.slice(-take).join("-") : full;

    return { full, short };
  }, [skuFull, tailParts]);

  if (!short) return null;

  return (
    <div className={`articule ${className}`} title={full}>
      <span className="articule__label">{label}:</span>
      <span className="articule__code">{short}</span>
    </div>
  );
}
