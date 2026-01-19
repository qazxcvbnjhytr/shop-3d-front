import { io } from "socket.io-client";

const RAW_API = import.meta.env.VITE_API_URL;
const RAW_SOCKET = import.meta.env.VITE_SOCKET_URL;

const normalizeOrigin = (url) => String(url || "").replace(/\/+$/, "");
const stripApiSuffix = (origin) => String(origin || "").replace(/\/api\/?$/, "");

if (!RAW_API && !RAW_SOCKET) {
  throw new Error("Missing VITE_API_URL (or VITE_SOCKET_URL) in client/.env(.local)");
}

const SOCKET_ORIGIN = stripApiSuffix(normalizeOrigin(RAW_SOCKET || RAW_API));

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_ORIGIN, {
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 400,
      // path: "/socket.io", // ✅ розкоментуй лише якщо на бекенді ти змінювала path
    });
  }
  return socket;
}

// якщо десь використовується як "origin" для посилань
export const API_BASE_URL = SOCKET_ORIGIN;
