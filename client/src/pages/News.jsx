import React from "react";
import { useTranslation } from "../hooks/useTranslation";

export default function News() {
  const { t, loading } = useTranslation();

  if (loading || !t?.header) {
    return null; // або Loader
  }

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>{t.header.news}</h1>
      <p>Новини і акції вашої компанії.</p>
    </div>
  );
}
