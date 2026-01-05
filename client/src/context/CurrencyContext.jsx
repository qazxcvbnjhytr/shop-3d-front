// client/src/context/CurrencyContext.jsx
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

export const CurrencyContext = createContext({
  currency: "UAH",
  setCurrency: () => {},
  rates: { UAH: 1 },
  loadingRates: false,
  ratesError: null,
  refreshRates: async () => {},
});

const NBU_URL = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json";
const CACHE_KEY = "ts_nbu_rates_v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 годин

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function fetchNbuRates() {
  const res = await fetch(NBU_URL, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`NBU rates request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  // rate = UAH за 1 одиницю валюти (USD, EUR, CAD, ...)
  const map = { UAH: 1 };

  if (Array.isArray(data)) {
    for (const row of data) {
      const code = String(row?.cc || "").toUpperCase();
      const rate = Number(row?.rate);

      if (code && Number.isFinite(rate) && rate > 0) {
        map[code] = rate;
      }
    }
  }

  return map;
}

export function CurrencyProvider({ children, defaultCurrency = "UAH" }) {
  const [currency, setCurrency] = useState(defaultCurrency);
  const [rates, setRates] = useState({ UAH: 1 });
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState(null);

  const refreshRates = useCallback(async () => {
    setLoadingRates(true);
    setRatesError(null);

    try {
      const fresh = await fetchNbuRates();
      setRates(fresh);

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ts: Date.now(), rates: fresh })
      );
    } catch (e) {
      setRatesError(e?.message || "Failed to load rates");
    } finally {
      setLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    const cached = cachedRaw ? safeParse(cachedRaw) : null;

    const isCacheValid =
      cached &&
      typeof cached.ts === "number" &&
      cached.rates &&
      typeof cached.rates === "object" &&
      Date.now() - cached.ts < CACHE_TTL_MS;

    if (isCacheValid) {
      setRates({ UAH: 1, ...cached.rates });
      setLoadingRates(false);
      return;
    }

    refreshRates();
  }, [refreshRates]);

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      rates,
      loadingRates,
      ratesError,
      refreshRates,
    }),
    [currency, rates, loadingRates, ratesError, refreshRates]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

// щоб не ламати старі імпорти default
export default CurrencyContext;
