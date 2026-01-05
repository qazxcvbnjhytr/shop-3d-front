import React, { useState, useMemo, useEffect } from "react";
import "./WhereToBuyMap.css";
import { useTranslation } from "../../../hooks/useTranslation";

const slugCity = (s = "") =>
  String(s)
    .trim()
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/\s+/g, "_");

export default function WhereToBuyMap({ points = [] }) {
  const { t, language } = useTranslation();
  const lang = language || "ua";

  // ✅ Новий словник перекладів локацій
  const locT = t?.locations || {};
  const locNames = locT?.names || {};
  const locAddresses = locT?.addresses || {};
  const locTypes = locT?.types || {};
  const locCities = locT?.cities || {};

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [activeId, setActiveId] = useState("");

  // ✅ Приводимо Mongo-формат до UI-формату
  const uiPoints = useMemo(() => {
    return (points || [])
      .filter((p) => p && p.isActive !== false)
      .map((p) => {
        const id = p._id?.$oid || p._id || p.id;

        // city може приходити як city або cityKey
        const cityRaw = p.city || "";
        const cityKey = p.cityKey || slugCity(cityRaw);

        const lat = Number(p?.coordinates?.lat ?? p?.lat);
        const lng = Number(p?.coordinates?.lng ?? p?.lng);

        const nameKey = p.nameKey || "";
        const addressKey = p.addressKey || "";

        const title =
          (nameKey && locNames?.[nameKey]) ||
          p.name ||
          cityRaw ||
          nameKey ||
          "Location";

        const address =
          (addressKey && locAddresses?.[addressKey]) ||
          p.address ||
          addressKey ||
          "";

        // тип: office / shop / warehouse
        const type = p.type || "shop";
        const typeLabel = locTypes?.[type] || type;

        // місто: показуємо як норм назву (Kyiv/Київ) якщо є словник
        const cityLabel = locCities?.[cityRaw] || cityRaw || cityKey;

        const hours =
          p?.workingHours?.[lang] ||
          p?.workingHours?.ua ||
          p?.workingHours?.en ||
          "";

        return {
          id,
          type,
          typeLabel,
          cityKey,
          cityRaw,
          cityLabel,
          title,
          address,
          phone: p.phone || "",
          hours,
          lat,
          lng,
        };
      })
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  }, [points, locNames, locAddresses, locTypes, locCities, lang]);

  const cityKeys = useMemo(() => {
    return [...new Set(uiPoints.map((p) => p.cityKey))].sort();
  }, [uiPoints]);

  const filtered = useMemo(() => {
    return uiPoints.filter((p) => {
      const matchCity = !selectedCity || p.cityKey === selectedCity;
      const matchType = selectedType === "all" || p.type === selectedType;
      return matchCity && matchType;
    });
  }, [uiPoints, selectedCity, selectedType]);

  useEffect(() => {
    if (!filtered.length) {
      setActiveId("");
      return;
    }
    const stillExists = filtered.some((p) => p.id === activeId);
    if (!activeId || !stillExists) setActiveId(filtered[0].id);
  }, [filtered, activeId]);

  const active = useMemo(() => {
    return filtered.find((p) => p.id === activeId) || null;
  }, [filtered, activeId]);

  const mapSrc = useMemo(() => {
    if (!active) return "";
    return `https://www.google.com/maps?q=${active.lat},${active.lng}&t=&z=17&ie=UTF8&iwloc=&output=embed`;
  }, [active]);

  // ✅ Лейбли кнопок (локалізація через locations.types, плюс норм fallback)
  const labelAll = language === "en" ? "All" : "Всі";
  const labelEmpty = language === "en" ? "No locations found" : "Точок не знайдено";
  const labelPick = language === "en" ? "Select a location from the list" : "Оберіть точку зі списку";
  const labelAllCities = language === "en" ? "All cities" : "Всі міста";

  const typeTabs = useMemo(
    () => [
      ["all", labelAll],
      ["shop", locTypes?.shop || (language === "en" ? "Showrooms" : "Шоуруми")],
      ["office", locTypes?.office || (language === "en" ? "Offices" : "Офіси")],
      ["warehouse", locTypes?.warehouse || (language === "en" ? "Warehouses" : "Склади")],
    ],
    [locTypes, language, labelAll]
  );

  return (
    <div className="wtb-container">
      {/* Фільтри */}
      <div className="wtb-filter-bar">
        <select
          className="wtb-select-minimal"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
        >
          <option value="">{labelAllCities}</option>

          {cityKeys.map((key) => {
            // беремо перший point з таким cityKey, щоб показати норм cityLabel
            const sample = uiPoints.find((p) => p.cityKey === key);
            const label = sample?.cityLabel || key;

            return (
              <option key={key} value={key}>
                {label}
              </option>
            );
          })}
        </select>

        <div className="wtb-type-group">
          {typeTabs.map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`wtb-tab ${selectedType === val ? "active" : ""}`}
              onClick={() => setSelectedType(val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="wtb-content-grid">
        {/* Список карток */}
        <div className="wtb-sidebar-list">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`wtb-location-card ${active?.id === p.id ? "active" : ""}`}
              onClick={() => setActiveId(p.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setActiveId(p.id);
              }}
            >
              <div className="info-line" style={{ fontWeight: 800, opacity: 0.85 }}>
                {p.typeLabel} • {p.cityLabel}
              </div>

              <h3>{p.title}</h3>

              {p.address ? <div className="info-line address-text">{p.address}</div> : null}
              {p.phone ? <div className="info-line phone-text">{p.phone}</div> : null}
              {p.hours ? <div className="info-line hours-text">{p.hours}</div> : null}
            </div>
          ))}

          {filtered.length === 0 && <div className="wtb-empty-msg">{labelEmpty}</div>}
        </div>

        {/* Карта */}
        <div className="wtb-map-viewport">
          {active ? (
            <iframe
              key={active.id}
              title="google-map"
              src={mapSrc}
              width="100%"
              height="100%"
              loading="lazy"
              style={{ border: 0 }}
              allowFullScreen
            />
          ) : (
            <div className="wtb-map-placeholder">{labelPick}</div>
          )}
        </div>
      </div>
    </div>
  );
}
