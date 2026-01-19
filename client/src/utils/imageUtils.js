// client/src/utils/imageUtils.js
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("Missing VITE_API_URL in client/.env(.local)");
}

const ORIGIN = String(API_URL).replace(/\/+$/, "");

/** Простий placeholder SVG (data URI). Можна замінити своїм Base64-лейаутом */
export const PLACEHOLDER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
     <rect width="100%" height="100%" fill="#f2f6f5"/>
     <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#98a6a4" font-family="Arial, Helvetica, sans-serif" font-size="22">Image not available</text>
   </svg>`
)}`;

/** Приводить шлях до дійсного URL з урахуванням локальних uploads */
export function getImageUrl(raw) {
  if (!raw) return PLACEHOLDER_SVG;

  const s = String(raw || "").trim();
  if (!s) return PLACEHOLDER_SVG;

  // уже абсолютний URL (cdn/railway/etc)
  if (/^(https?:)?\/\//i.test(s)) return s;

  // якщо абсолютний шлях на сервері (/uploads/..., /img/..., /assets/...)
  if (s.startsWith("/")) return `${ORIGIN}${s}`;

  // інакше — приписуємо origin
  return `${ORIGIN}/${s}`;
}

/** Preload зображення з crossOrigin; повертає або оригінальний url, або placeholder */
export function preloadImageSafe(url) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(url);
      img.onerror = () => resolve(PLACEHOLDER_SVG);
      img.src = url;

      if (img.complete && img.naturalWidth) resolve(url);
    } catch {
      resolve(PLACEHOLDER_SVG);
    }
  });
}
