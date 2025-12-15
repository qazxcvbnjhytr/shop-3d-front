import React, { useContext, useMemo } from "react";
import { CurrencyContext } from "../context/CurrencyContext.jsx";
import { applyDiscount, convertFromUAH, formatMoney } from "../utils/money.js";

export default function Price({ priceUAH, discountPercent = 0 }) {
  const { currency, rates, loadingRates } = useContext(CurrencyContext);

  const { converted } = useMemo(() => {
    const baseValueUAH = applyDiscount(priceUAH, discountPercent);
    const converted = convertFromUAH(baseValueUAH, currency, rates);
    return { baseValueUAH, converted };
  }, [priceUAH, discountPercent, currency, rates]);

  if (loadingRates && currency !== "UAH") {
    return <span>…</span>;
  }

  return (
    <span>
      {formatMoney(converted, currency)}
    </span>
  );
}
