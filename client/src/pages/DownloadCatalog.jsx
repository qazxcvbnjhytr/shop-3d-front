import React from "react";
import { useTranslation } from "../hooks/useTranslation";

export default function DownloadCatalog() {
  const { t, loading } = useTranslation();

  if (loading || !t?.header) {
    return null; // або Loader
  }

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>{t.header.downloadCatalog}</h1>
      <p>Сторінка для завантаження каталогу.</p>
    </div>
  );
}
