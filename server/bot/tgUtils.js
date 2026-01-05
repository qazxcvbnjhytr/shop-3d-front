export const tgGuestId = (chatId) => `tg:${String(chatId)}`;
export const isTgGuestId = (id) => typeof id === "string" && id.startsWith("tg:");
export const tgChatIdFromGuestId = (id) => String(id || "").slice(3);

export function normalizeText(x) {
  return typeof x === "string" ? x.replace(/\r\n/g, "\n") : "";
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export function isStrongEnoughPassword(pw) {
  return String(pw || "").length >= 6;
}

export function parseCmd(text = "") {
  const t = String(text || "").trim();
  if (!t.startsWith("/")) return null;
  const [cmd, ...args] = t.split(/\s+/);
  return { cmd: cmd.toLowerCase(), args };
}
