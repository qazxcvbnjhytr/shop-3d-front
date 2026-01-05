// client/src/utils/imageUtils.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  if (/^https?:\/\//i.test(s)) return s;
  // якщо вже абсолютний шлях на сервері (/uploads/...)
  if (s.startsWith("/")) return `${API_URL}${s}`;
  // інакше — теж приписуємо API_URL
  return `${API_URL}/${s}`;
}

/** Preload зображення з crossOrigin; повертає або оригінальний url, або placeholder */
export function preloadImageSafe(url) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(url);
      img.onerror = () => resolve(PLACEHOLDER_SVG);
      // починаємо завантаження
      img.src = url;
      // якщо браузер вже cached and complete
      if (img.complete && img.naturalWidth) {
        resolve(url);
      }
    } catch {
      resolve(PLACEHOLDER_SVG);
    }
  });
}
