import React from "react";
import "./Price.css";

export default function Price({
  value,
  oldValue,
  suffix = "грн",
  className = "",
}) {
  const v = Number(value);
  const ov = Number(oldValue);

  const ok = Number.isFinite(v) && v > 0;
  const hasOld = Number.isFinite(ov) && ov > v;

  if (!ok) {
    return <span className={`price price--empty ${className}`}>—</span>;
  }

  return (
    <span className={`price ${className}`}>
      {hasOld && (
        <span className="price__old">
          <span className="price__value">{Math.round(ov)}</span>
          <span className="price__suffix">{suffix}</span>
        </span>
      )}

      <span className={`price__current ${hasOld ? "price__current--sale" : ""}`}>
        <span className="price__value">{Math.round(v)}</span>
        <span className="price__suffix">{suffix}</span>
      </span>
    </span>
  );
}
