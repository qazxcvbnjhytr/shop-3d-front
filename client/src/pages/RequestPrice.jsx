import React from "react";
import { useTranslation } from "../hooks/useTranslation";

export default function RequestPrice() {
  const { t, loading } = useTranslation();

  if (loading || !t?.header) {
    return null; // або Loader
  }

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>{t.header.requestPrice}</h1>
      <p>Форма для запиту прайсу.</p>
    </div>
  );
}
