import { io } from "socket.io-client";

const RAW = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE = String(RAW).replace(/\/+$/, "").replace(/\/api\/?$/, "");

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE, {
      withCredentials: true,
      transports: ["polling", "websocket"], // ✅ важливо
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 400,
    });
  }
  return socket;
}

export const API_BASE_URL = API_BASE;
