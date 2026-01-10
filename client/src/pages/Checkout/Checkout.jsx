// client/src/pages/Checkout/Checkout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { useTranslation } from "../../hooks/useTranslation";
import { useLocations } from "../../hooks/useLocations";
import { ordersApi } from "../../api/ordersApi.js";
import "./Checkout.css";

const STORAGE_KEY = "checkout.form.v3";

const normalizePhone = (s) => String(s || "").replace(/[^\d+]/g, "").trim();

const isValidEmail = (email) => {
  const v = String(email || "").trim();
  if (!v) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};

const formatUAH = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `${Math.round(v).toLocaleString("uk-UA")} грн`;
};

const mapLink = (lat, lng) => {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return "";
  return `https://www.google.com/maps?q=${la},${ln}`;
};

export default function Checkout() {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const { t, language } = useTranslation();
  const lang = language === "en" ? "en" : "ua";

  // ✅ MUST be inside <CartProvider />
  const {
    loading: cartLoading,
    isEmpty,
    items,
    subtotal,
    totalSavings,
    cartTotal,
    emptyCart,
  } = useCart();

  const { locations, loading: locLoading, error: locError, reload } = useLocations();

  // ✅ якщо кошик порожній — повертаємо в кошик
  useEffect(() => {
    if (!cartLoading && isEmpty) navigate("/shopping-cart");
  }, [cartLoading, isEmpty, navigate]);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    deliveryMethod: "pickup", // pickup | courier | nova_poshta
    pickupLocationId: "",
    npOffice: "",
    address: "",
    comment: "",
    agree: true,
  });

  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setField = (name, value) => setForm((p) => ({ ...p, [name]: value }));
  const markTouched = (name) => setTouched((p) => ({ ...p, [name]: true }));

  // restore
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") setForm((p) => ({ ...p, ...parsed }));
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  const locText = useMemo(() => {
    return {
      type: (type) => t?.locations?.types?.[type] || type,
      city: (city) => t?.locations?.cities?.[city] || city,
      name: (nameKey) => t?.locations?.names?.[nameKey] || nameKey,
      address: (addressKey) => t?.locations?.addresses?.[addressKey] || addressKey,
    };
  }, [t]);

  const cities = useMemo(() => {
    const set = new Set();
    (locations || []).forEach((l) => {
      if (l?.city) set.add(l.city);
    });
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b), "uk"));
  }, [locations]);

  const cityLocations = useMemo(() => {
    const city = (form.city || "").trim();
    if (!city) return [];
    return (locations || []).filter((l) => l?.city === city);
  }, [locations, form.city]);

  const pickupLocations = useMemo(() => {
    return cityLocations.filter((l) => ["shop", "office"].includes(l?.type));
  }, [cityLocations]);

  const pickedLocation = useMemo(() => {
    const id = form.pickupLocationId;
    if (!id) return null;
    return pickupLocations.find((l) => String(l?._id) === String(id)) || null;
  }, [pickupLocations, form.pickupLocationId]);

  const errors = useMemo(() => {
    const e = {};
    const phone = normalizePhone(form.phone);

    if (!String(form.fullName || "").trim()) {
      e.fullName = lang === "en" ? "Enter full name" : "Вкажіть ім’я та прізвище";
    }

    if (!phone || phone.length < 10) {
      e.phone = lang === "en" ? "Enter a valid phone number" : "Вкажіть коректний номер телефону";
    }

    if (!isValidEmail(form.email)) {
      e.email = lang === "en" ? "Invalid email format" : "Невірний формат email";
    }

    if (!String(form.city || "").trim()) {
      e.city = lang === "en" ? "Choose a city" : "Оберіть місто";
    }

    if (form.deliveryMethod === "pickup") {
      if (!form.pickupLocationId) {
        e.pickupLocationId = lang === "en" ? "Choose pickup point" : "Оберіть точку самовивозу";
      }
    }

    if (form.deliveryMethod === "courier") {
      if (!String(form.address || "").trim()) {
        e.address = lang === "en" ? "Enter delivery address" : "Вкажіть адресу доставки";
      }
    }

    if (form.deliveryMethod === "nova_poshta") {
      if (!String(form.npOffice || "").trim()) {
        e.npOffice = lang === "en" ? "Enter Nova Poshta office/locker" : "Вкажіть відділення/поштомат Нової Пошти";
      }
    }

    if (!form.agree) {
      e.agree = lang === "en" ? "Consent is required" : "Потрібна згода на обробку даних";
    }

    if (!Array.isArray(items) || items.length === 0) {
      e.cart = lang === "en" ? "Cart is empty" : "Кошик порожній";
    }

    return e;
  }, [form, items, lang]);

  const canSubmit = Object.keys(errors).length === 0;

  const onChangeDelivery = (method) => {
    setForm((p) => ({
      ...p,
      deliveryMethod: method,
      pickupLocationId: method === "pickup" ? p.pickupLocationId : "",
      address: method === "courier" ? p.address : "",
      npOffice: method === "nova_poshta" ? p.npOffice : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    setTouched({
      fullName: true,
      phone: true,
      email: true,
      city: true,
      pickupLocationId: true,
      address: true,
      npOffice: true,
      agree: true,
    });

    if (!canSubmit || submitting) return;

    try {
      setSubmitting(true);

      const payload = {
        customer: {
          fullName: String(form.fullName || "").trim(),
          phone: normalizePhone(form.phone),
          email: String(form.email || "").trim(),
        },
        delivery: {
          city: String(form.city || "").trim(),
          method: form.deliveryMethod,
          pickupLocationId: form.deliveryMethod === "pickup" ? String(form.pickupLocationId || "") : "",
          address: form.deliveryMethod === "courier" ? String(form.address || "").trim() : "",
          npOffice: form.deliveryMethod === "nova_poshta" ? String(form.npOffice || "").trim() : "",
        },
        comment: String(form.comment || "").trim(),
        items: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          qty: it.qty,
          price: it.finalPrice,
          sku: it.sku,
          image: it.imageSrc,
        })),
        totals: { subtotal, totalSavings, cartTotal },
      };

      // ✅ реально відправляємо на сервер: POST /api/orders (protect)
      const created = await ordersApi.createMy(payload);

      // очистка кошика
      try {
        await emptyCart?.();
      } catch {}

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}

      // редірект в кабінет (під замовлення)
      const orderId = created?.order?._id || created?._id || created?.id || "";
      if (orderId) {
        navigate(`/account?tab=orders&order=${encodeURIComponent(orderId)}`);
      } else {
        navigate("/account?tab=orders");
      }
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401) {
        // токен відсутній/протух — логін і повернення назад
        navigate("/login", {
          replace: true,
          state: { from: routerLocation?.pathname || "/checkout" },
        });
        return;
      }

      setSubmitError(
        err?.response?.data?.message ||
          err?.message ||
          (lang === "en" ? "Failed to create order" : "Не вдалося створити замовлення")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="checkout-page">
        <div className="checkout-shell">{lang === "en" ? "Loading..." : "Завантаження..."}</div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-shell">
        <div className="checkout-head">
          <button className="chk-back" type="button" onClick={() => navigate("/shopping-cart")}>
            ← {lang === "en" ? "Back to cart" : "Назад до кошика"}
          </button>

          <h1 className="checkout-title">{lang === "en" ? "Checkout" : "Оформлення замовлення"}</h1>
          <p className="checkout-subtitle">
            {lang === "en"
              ? "Fill in your contacts and choose delivery method."
              : "Заповніть контакти та оберіть спосіб отримання."}
          </p>
        </div>

        <form className="checkout-form" onSubmit={handleSubmit}>
          {/* Контакти */}
          <section className="chk-card">
            <div className="chk-card__title">{lang === "en" ? "Contact details" : "Контактні дані"}</div>

            <div className="chk-grid">
              <label className="chk-field">
                <span className="chk-label">{lang === "en" ? "Full name *" : "Ім’я та прізвище *"}</span>
                <input
                  className={`chk-input ${touched.fullName && errors.fullName ? "is-error" : ""}`}
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  onBlur={() => markTouched("fullName")}
                  placeholder={lang === "en" ? "e.g. Natalia Shumska" : "Наприклад: Наталія Шумська"}
                  autoComplete="name"
                />
                {touched.fullName && errors.fullName && <span className="chk-error">{errors.fullName}</span>}
              </label>

              <label className="chk-field">
                <span className="chk-label">{lang === "en" ? "Phone *" : "Телефон *"}</span>
                <input
                  className={`chk-input ${touched.phone && errors.phone ? "is-error" : ""}`}
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  onBlur={() => markTouched("phone")}
                  placeholder="+380..."
                  inputMode="tel"
                  autoComplete="tel"
                />
                {touched.phone && errors.phone && <span className="chk-error">{errors.phone}</span>}
              </label>

              <label className="chk-field">
                <span className="chk-label">{lang === "en" ? "Email (optional)" : "Email (необов’язково)"}</span>
                <input
                  className={`chk-input ${touched.email && errors.email ? "is-error" : ""}`}
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  onBlur={() => markTouched("email")}
                  placeholder="name@example.com"
                  inputMode="email"
                  autoComplete="email"
                />
                {touched.email && errors.email && <span className="chk-error">{errors.email}</span>}
              </label>
            </div>
          </section>

          {/* Отримання */}
          <section className="chk-card">
            <div className="chk-card__title">{lang === "en" ? "Delivery & pickup" : "Отримання"}</div>

            <div className="delivery-tabs">
              <button
                type="button"
                className={`delivery-tab ${form.deliveryMethod === "pickup" ? "active" : ""}`}
                onClick={() => onChangeDelivery("pickup")}
              >
                {lang === "en" ? "Pickup" : "Самовивіз"}
              </button>

              <button
                type="button"
                className={`delivery-tab ${form.deliveryMethod === "courier" ? "active" : ""}`}
                onClick={() => onChangeDelivery("courier")}
              >
                {lang === "en" ? "Courier" : "Кур’єр"}
              </button>

              <button
                type="button"
                className={`delivery-tab ${form.deliveryMethod === "nova_poshta" ? "active" : ""}`}
                onClick={() => onChangeDelivery("nova_poshta")}
              >
                {lang === "en" ? "Nova Poshta" : "Нова Пошта"}
              </button>
            </div>

            {/* Місто */}
            <div className="chk-grid">
              <label className="chk-field">
                <span className="chk-label">{lang === "en" ? "City *" : "Місто *"}</span>

                <select
                  className={`chk-input ${touched.city && errors.city ? "is-error" : ""}`}
                  value={form.city}
                  onChange={(e) => {
                    const city = e.target.value;
                    setForm((p) => ({ ...p, city, pickupLocationId: "" }));
                  }}
                  onBlur={() => markTouched("city")}
                >
                  <option value="">{lang === "en" ? "Choose a city" : "Оберіть місто"}</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {locText.city(c)}
                    </option>
                  ))}
                </select>

                {touched.city && errors.city && <span className="chk-error">{errors.city}</span>}

                {(locLoading || locError) && (
                  <div className="chk-hint">
                    {locLoading
                      ? (lang === "en" ? "Loading locations..." : "Завантаження точок...")
                      : (lang === "en" ? `Locations error: ${locError}` : `Помилка точок: ${locError}`)}
                    {!locLoading && (
                      <button type="button" className="link-btn" onClick={reload}>
                        {lang === "en" ? "Retry" : "Спробувати ще раз"}
                      </button>
                    )}
                  </div>
                )}
              </label>
            </div>

            {/* Самовивіз */}
            {form.deliveryMethod === "pickup" && (
              <div className="chk-grid">
                <label className="chk-field">
                  <span className="chk-label">{lang === "en" ? "Pickup point *" : "Точка самовивозу *"}</span>

                  <select
                    className={`chk-input ${touched.pickupLocationId && errors.pickupLocationId ? "is-error" : ""}`}
                    value={form.pickupLocationId}
                    onChange={(e) => setField("pickupLocationId", e.target.value)}
                    onBlur={() => markTouched("pickupLocationId")}
                    disabled={!form.city}
                  >
                    <option value="">
                      {form.city
                        ? (lang === "en" ? "Choose a location" : "Оберіть точку")
                        : (lang === "en" ? "Choose city first" : "Спочатку оберіть місто")}
                    </option>

                    {pickupLocations.map((l) => (
                      <option key={String(l._id)} value={String(l._id)}>
                        {locText.type(l.type)} — {locText.name(l.nameKey)}
                      </option>
                    ))}
                  </select>

                  {touched.pickupLocationId && errors.pickupLocationId && (
                    <span className="chk-error">{errors.pickupLocationId}</span>
                  )}
                </label>

                {pickedLocation && (
                  <div className="location-card">
                    <div className="location-card__top">
                      <div className="location-title">
                        {locText.name(pickedLocation.nameKey)}
                        <span className="location-type">{locText.type(pickedLocation.type)}</span>
                      </div>
                      {pickedLocation.phone && <div className="location-phone">{pickedLocation.phone}</div>}
                    </div>

                    <div className="location-address">{locText.address(pickedLocation.addressKey)}</div>

                    {(pickedLocation.workingHours?.ua || pickedLocation.workingHours?.en) && (
                      <div className="location-hours">
                        {lang === "en" ? pickedLocation.workingHours?.en : pickedLocation.workingHours?.ua}
                      </div>
                    )}

                    {pickedLocation.coordinates?.lat != null && pickedLocation.coordinates?.lng != null && (
                      <a
                        className="location-map"
                        href={mapLink(pickedLocation.coordinates.lat, pickedLocation.coordinates.lng)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {lang === "en" ? "Open on map" : "Відкрити на мапі"}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Кур’єр */}
            {form.deliveryMethod === "courier" && (
              <div className="chk-grid">
                <label className="chk-field">
                  <span className="chk-label">{lang === "en" ? "Delivery address *" : "Адреса доставки *"}</span>
                  <input
                    className={`chk-input ${touched.address && errors.address ? "is-error" : ""}`}
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    onBlur={() => markTouched("address")}
                    placeholder={lang === "en" ? "Street, house, apartment" : "Вулиця, будинок, квартира"}
                    autoComplete="street-address"
                  />
                  {touched.address && errors.address && <span className="chk-error">{errors.address}</span>}
                  <div className="chk-hint">
                    {lang === "en"
                      ? "Our courier delivers within the selected city."
                      : "Наш кур’єр доставить замовлення в межах обраного міста."}
                  </div>
                </label>
              </div>
            )}

            {/* Нова Пошта */}
            {form.deliveryMethod === "nova_poshta" && (
              <div className="chk-grid">
                <label className="chk-field">
                  <span className="chk-label">
                    {lang === "en" ? "Nova Poshta office/parcel locker *" : "Відділення/поштомат Нової Пошти *"}
                  </span>
                  <input
                    className={`chk-input ${touched.npOffice && errors.npOffice ? "is-error" : ""}`}
                    value={form.npOffice}
                    onChange={(e) => setField("npOffice", e.target.value)}
                    onBlur={() => markTouched("npOffice")}
                    placeholder={lang === "en" ? "e.g. Office #12" : "Напр. Відділення №12"}
                  />
                  {touched.npOffice && errors.npOffice && <span className="chk-error">{errors.npOffice}</span>}
                </label>
              </div>
            )}
          </section>

          {/* Коментар */}
          <section className="chk-card">
            <div className="chk-card__title">{lang === "en" ? "Comment (optional)" : "Коментар (необов’язково)"}</div>
            <textarea
              className="chk-textarea"
              rows={3}
              value={form.comment}
              onChange={(e) => setField("comment", e.target.value)}
              placeholder={lang === "en" ? "Any notes for the manager..." : "Побажання, зручний час дзвінка тощо..."}
            />
          </section>

          {/* Підсумок */}
          <section className="chk-card chk-card--summary">
            <div className="sumRow">
              <span>{lang === "en" ? "Subtotal:" : "Сума за товари:"}</span>
              <span className="val">{formatUAH(subtotal)}</span>
            </div>

            {Number(totalSavings) > 0 && (
              <div className="sumRow sumRow-save">
                <span>{lang === "en" ? "Savings:" : "Економія:"}</span>
                <span className="val">- {formatUAH(totalSavings)}</span>
              </div>
            )}

            <div className="sumRow sumRow-total">
              <span>{lang === "en" ? "Total:" : "Разом до сплати:"}</span>
              <span className="val total">{formatUAH(cartTotal)}</span>
            </div>

            <label className="chk-agree">
              <input
                type="checkbox"
                checked={!!form.agree}
                onChange={(e) => setField("agree", e.target.checked)}
                onBlur={() => markTouched("agree")}
              />
              <span>
                {lang === "en"
                  ? "I agree to the processing of my personal data."
                  : "Я погоджуюся на обробку персональних даних."}
              </span>
            </label>
            {touched.agree && errors.agree && <div className="chk-error">{errors.agree}</div>}

            {touched.fullName && errors.cart && <div className="chk-alert">{errors.cart}</div>}
            {submitError && <div className="chk-alert">{submitError}</div>}

            <button className="chk-submit" type="submit" disabled={!canSubmit || submitting}>
              {submitting
                ? (lang === "en" ? "Sending..." : "Відправка...")
                : (lang === "en" ? "Confirm order" : "Підтвердити замовлення")}
            </button>

            <div className="chk-footnote">
              {lang === "en"
                ? "Manager will contact you to confirm details."
                : "Менеджер зв’яжеться з вами для підтвердження деталей."}
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
