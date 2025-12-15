import React from "react";
import { useTranslation } from "../hooks/useTranslation";

export default function WhereToBuy() {
  const { t, loading } = useTranslation();

  if (loading || !t?.header) {
    return null; // або Loader
  }

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>{t.header.whereToBuy}</h1>
      <p>Інформація про те, де купити продукцію.</p>
    </div>
  );
}
