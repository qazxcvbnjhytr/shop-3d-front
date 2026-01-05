// client/src/utils/money.js
export function applyDiscount(priceUAH, discountPercent = 0) {
  const p = Number(priceUAH);
  const d = Number(discountPercent);

  if (!Number.isFinite(p) || p <= 0) return 0;
  if (!Number.isFinite(d) || d <= 0) return Math.round(p);

  const clamped = Math.min(100, Math.max(0, d));
  return Math.round(p - (p * clamped) / 100);
}

// rates: { USD: 42.12, EUR: 45.7, UAH: 1 }  => rate = UAH за 1 валюту
export function convertFromUAH(amountUAH, currency, rates = {}) {
  const a = Number(amountUAH);
  if (!Number.isFinite(a)) return 0;

  const cur = String(currency || "UAH").toUpperCase();
  if (cur === "UAH") return a;

  const rate = Number(rates?.[cur]);
  if (!Number.isFinite(rate) || rate <= 0) return a; // fallback

  return a / rate;
}

export function formatMoney(value, currency = "UAH") {
  const v = Number(value);
  const cur = String(currency || "UAH").toUpperCase();

  const safe = Number.isFinite(v) ? v : 0;

  const maximumFractionDigits = cur === "UAH" ? 0 : 2;

  try {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: cur,
      maximumFractionDigits,
      minimumFractionDigits: 0,
    }).format(safe);
  } catch {
    // якщо валюта невалідна для Intl
    return `${safe.toFixed(maximumFractionDigits)} ${cur}`;
  }
}
