import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LanguageContext } from "@context/LanguageContext";
import "./HeaderSearch.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const MAX_RESULTS = 10;
const MIN_LEN = 1;
const DEBOUNCE_MS = 220;

const normalize = (s = "") =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const pickText = (value, language = "ua") => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") return value?.[language] || value?.ua || value?.en || "";
  return "";
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// discount = % (0..100)
const calcPrices = (price, discount) => {
  const p = toNumber(price);
  const d = Math.min(100, Math.max(0, toNumber(discount)));
  const hasDiscount = d > 0;
  const finalPrice = hasDiscount ? Math.round((p * (100 - d)) / 100) : p;
  return { price: p, discount: d, hasDiscount, finalPrice };
};

const buildImg = (raw) => {
  if (!raw || typeof raw !== "string") return "/placeholder.png";
  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${API_URL}${raw}`;
  return `${API_URL}/${raw}`.replace(/\/{2,}/g, "/").replace(":/", "://");
};

export default function HeaderSearch() {
  const navigate = useNavigate();
  const { language } = useContext(LanguageContext);

  const wrapRef = useRef(null);
  const loadedRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(false);

  // [{ id, category, subCategory, img, nameUa, nameEn, price, discount, blob }]
  const [index, setIndex] = useState([]);

  // debounce введення
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);

  const loadIndexOnce = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/api/products`);
      const arr = Array.isArray(res.data) ? res.data : [];

      const mapped = arr.map((p, idx) => {
        const id = String(p?._id || p?.id || `p-${idx}`);

        const category = String(p?.category || p?.productCategory || p?.categoryKey || "all");
        const subCategory = String(p?.subCategory || p?.subcategory || p?.subCategoryKey || "product");

        const nameUa = pickText(p?.name, "ua") || pickText(p?.productName, "ua");
        const nameEn = pickText(p?.name, "en") || pickText(p?.productName, "en");

        const imgRaw =
          p?.image ||
          (Array.isArray(p?.images) ? p.images[0] : null) ||
          p?.productImage ||
          null;

        const img = buildImg(imgRaw);

        // ✅ зберігаємо сирі значення з БД (price + discount%)
        const price = toNumber(p?.price);
        const discount = toNumber(p?.discount);

        // blob для пошуку
        const type = p?.typeKey || p?.type || "";
        const material = p?.specifications?.materialKey || p?.materialKey || p?.material || "";
        const color = p?.colorKey || p?.color || "";
        const room = p?.roomKey || p?.room || "";
        const sku = p?.sku || "";

        const blob = normalize(
          `${nameUa} ${nameEn} ${sku} ${category} ${subCategory} ${type} ${material} ${color} ${room}`
        );

        return { id, category, subCategory, img, nameUa, nameEn, price, discount, blob };
      });

      setIndex(mapped);
    } catch (e) {
      console.error("[HeaderSearch] products load error:", e);
      setIndex([]);
      loadedRef.current = false; // дозволяємо повторити
    } finally {
      setLoading(false);
    }
  }, []);

  // клік поза компонентом
  useEffect(() => {
    const onDown = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const queryNorm = useMemo(() => normalize(debouncedQ), [debouncedQ]);

  const results = useMemo(() => {
    if (!queryNorm || queryNorm.length < MIN_LEN) return [];
    if (!index.length) return [];

    const out = index.filter((it) => it.blob.includes(queryNorm)).slice(0, MAX_RESULTS);

    return out.map((it) => {
      const displayName =
        language === "ua" ? (it.nameUa || it.nameEn) : (it.nameEn || it.nameUa);

      const { hasDiscount, finalPrice } = calcPrices(it.price, it.discount);

      // ✅ правильний роут: /catalog/:category/:subCategory/:id
      const to = `/catalog/${it.category}/${it.subCategory}/${it.id}`;

      return {
        ...it,
        displayName: displayName || (language === "ua" ? "Товар" : "Product"),
        hasDiscount,
        finalPrice,
        to,
      };
    });
  }, [index, queryNorm, language]);

  const onFocus = async () => {
    setOpen(true);
    await loadIndexOnce();
  };

  const goTo = (to) => {
    setOpen(false);
    navigate(to);
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (results.length) {
      goTo(results[0].to);
      return;
    }

    navigate("/catalog");
    setOpen(false);
  };

  return (
    <div className="hs" ref={wrapRef}>
      <form className={`hs-box ${open ? "open" : ""}`} onSubmit={onSubmit}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={onFocus}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={
            language === "ua"
              ? "Пошук меблів (назва, тип, матеріал...)"
              : "Search furniture (name, type, material...)"
          }
          aria-label="Search"
          autoComplete="off"
        />

        <button type="submit" disabled={loading}>
          {language === "ua" ? "Знайти" : "Search"}
        </button>
      </form>

      {open && q.trim().length >= MIN_LEN && (
        <div className="hs-dd" role="listbox">
          <div className="hs-dd__head">
            <div className="hs-dd__title">
              {loading
                ? (language === "ua" ? "Завантаження..." : "Loading...")
                : (language === "ua" ? "Результати" : "Results")}
            </div>

            <button
              className="hs-dd__close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="hs-dd__body">
            {!loading && results.length === 0 && (
              <div className="hs-dd__empty">
                {language === "ua" ? "Нічого не знайдено." : "Nothing found."}
              </div>
            )}

            {!!results.length && (
              <ul className="hs-dd__list">
                {results.map((it) => (
                  <li key={it.id} className="hs-dd__item">
                    <button type="button" className="hs-dd__row" onClick={() => goTo(it.to)}>
                      <img
                        className="hs-dd__img"
                        src={it.img}
                        alt={it.displayName}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.png";
                        }}
                      />

                      <div className="hs-dd__meta">
                        <div className="hs-dd__name" title={it.displayName}>
                          {it.displayName}
                        </div>

                        <div className="hs-dd__price">
                          {it.price > 0 && it.hasDiscount && (
                            <span className="hs-dd__old">{Math.round(it.price)} грн</span>
                          )}
                          {it.price > 0 && (
                            <span className="hs-dd__now">{Math.round(it.finalPrice)} грн</span>
                          )}
                        </div>
                      </div>

                      {it.hasDiscount && (
                        <span className="hs-dd__badge">-{Math.round(it.discount)}%</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!loading && results.length > 0 && (
            <div className="hs-dd__foot">
              {language === "ua"
                ? "Enter — відкрити перший результат"
                : "Enter — open first result"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
