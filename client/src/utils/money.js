export function convertFromUAH(amountUAH, toCurrency, rates) {
  if (!amountUAH || Number.isNaN(Number(amountUAH))) return 0;

  const value = Number(amountUAH);
  if (toCurrency === "UAH") return value;

  const rate = rates?.[toCurrency];
  if (!rate) return value; // fallback

  // якщо НБУ дає "скільки грн за 1 USD", то для USD/EUR ділимо
  return value / rate;
}

export function formatMoney(value, currency) {
  const decimals = currency === "UAH" ? 0 : 2;
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function applyDiscount(priceUAH, discountPercent) {
  const p = Number(priceUAH) || 0;
  const d = Number(discountPercent) || 0;
  if (d <= 0) return p;
  return p * (1 - d / 100);
}
