import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import Message from "../models/Message.js";

import { helpText } from "./tgCommands.js";
import { guestMenuKeyboard, authedMenuKeyboard, cancelKeyboard } from "./tgKeyboards.js";
import { parseCmd, normalizeText, isValidEmail, isStrongEnoughPassword, tgGuestId, isTgGuestId, tgChatIdFromGuestId } from "./tgUtils.js";
import { ensureSession, getSession, setSession, resetFlow, logoutSession, getSessionByUserId } from "./tgSessionStore.js";

async function safeSend(bot, chatId, text, opts = {}) {
  try {
    return await bot.sendMessage(chatId, text, opts);
  } catch (e) {
    console.error("TG send error:", e?.message || e);
  }
}

function menuFor(session) {
  return session?.userId ? authedMenuKeyboard() : guestMenuKeyboard();
}

async function showMenu(bot, chatId, session, extra = "") {
  const isAuthed = Boolean(session?.userId);
  const statusLine = isAuthed
    ? "Статус: ви увійшли в акаунт."
    : "Статус: ви гість (можна зареєструватись або увійти).";

  const text =
    `${extra ? extra + "\n\n" : ""}${statusLine}\n\nОберіть дію:`;

  await safeSend(bot, chatId, text, { reply_markup: menuFor(session) });
}

export function initTelegramBot({
  io,
  adminId,
  enabled,
  token,
  apiBase = "http://localhost:5000",
}) {
  if (!enabled) {
    console.log("🟡 Telegram bot disabled (TELEGRAM_BOT_ENABLED=false)");
    return { bot: null };
  }
  if (!token) {
    console.log("🟠 Telegram bot token missing (TELEGRAM_BOT_TOKEN)");
    return { bot: null };
  }
  if (!adminId) {
    console.log("🟠 ADMIN_ID missing (ADMIN_ID)");
    return { bot: null };
  }

  const bot = new TelegramBot(token, { polling: true });

  // ===== Commands =====
  bot.onText(/\/start/i, async (msg) => {
    const chatId = msg.chat.id;
    const session = await ensureSession(chatId);
    await showMenu(bot, chatId, session, "Вітаємо у MebliHUB Support.");
  });

  bot.onText(/\/help/i, async (msg) => {
    const chatId = msg.chat.id;
    const session = await ensureSession(chatId);
    await safeSend(bot, chatId, helpText(), { reply_markup: menuFor(session) });
  });

  bot.onText(/\/cancel/i, async (msg) => {
    const chatId = msg.chat.id;
    await resetFlow(chatId);
    const session = await ensureSession(chatId);
    await showMenu(bot, chatId, session, "❌ Скасовано.");
  });

  bot.onText(/\/logout/i, async (msg) => {
    const chatId = msg.chat.id;
    await logoutSession(chatId);
    const session = await ensureSession(chatId);
    await showMenu(bot, chatId, session, "🚪 Ви вийшли з акаунта.");
  });

  bot.onText(/\/register/i, async (msg) => {
    const chatId = msg.chat.id;
    const session = await ensureSession(chatId);

    if (session.userId) {
      await showMenu(bot, chatId, session, "Ви вже увійшли. Щоб зареєструвати інший акаунт — спочатку натисніть 🚪 Вийти.");
      return;
    }

    await setSession(chatId, { flow: "register", step: "name", temp: { name: null, email: null } });
    await safeSend(bot, chatId, "📝 Реєстрація\nВведіть ваше імʼя:", { reply_markup: cancelKeyboard() });
  });

  bot.onText(/\/login/i, async (msg) => {
    const chatId = msg.chat.id;
    const session = await ensureSession(chatId);

    if (session.userId) {
      await showMenu(bot, chatId, session, "Ви вже увійшли. Щоб увійти іншим акаунтом — спочатку натисніть 🚪 Вийти.");
      return;
    }

    await setSession(chatId, { flow: "login", step: "email", temp: { name: null, email: null } });
    await safeSend(bot, chatId, "🔐 Вхід\nВведіть email:", { reply_markup: cancelKeyboard() });
  });

  // ===== Main message handler =====
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const raw = normalizeText(msg.text || "");
    if (!raw.trim()) return;

    // ignore /commands here (handled above)
    if (parseCmd(raw)) return;

    const btn = raw.trim();

    const session = await ensureSession(chatId);

    // --- Button routing ---
    if (btn === "❓ Допомога") {
      await safeSend(bot, chatId, helpText(), { reply_markup: menuFor(session) });
      return;
    }

    if (btn === "🚪 Вийти") {
      await logoutSession(chatId);
      const s2 = await ensureSession(chatId);
      await showMenu(bot, chatId, s2, "🚪 Ви вийшли з акаунта.");
      return;
    }

    if (btn === "📝 Реєстрація") {
      if (session.userId) {
        await showMenu(bot, chatId, session, "Ви вже увійшли. Спочатку натисніть 🚪 Вийти.");
        return;
      }
      await setSession(chatId, { flow: "register", step: "name", temp: { name: null, email: null } });
      await safeSend(bot, chatId, "📝 Реєстрація\nВведіть ваше імʼя:", { reply_markup: cancelKeyboard() });
      return;
    }

    if (btn === "🔐 Вхід") {
      if (session.userId) {
        await showMenu(bot, chatId, session, "Ви вже увійшли. Спочатку натисніть 🚪 Вийти.");
        return;
      }
      await setSession(chatId, { flow: "login", step: "email", temp: { name: null, email: null } });
      await safeSend(bot, chatId, "🔐 Вхід\nВведіть email:", { reply_markup: cancelKeyboard() });
      return;
    }

    if (btn === "💬 Підтримка") {
      await setSession(chatId, { flow: "support", step: "message" });
      await safeSend(bot, chatId, "💬 Напишіть повідомлення для підтримки:", { reply_markup: cancelKeyboard() });
      return;
    }

    if (btn === "❌ Скасувати") {
      await resetFlow(chatId);
      const s2 = await ensureSession(chatId);
      await showMenu(bot, chatId, s2, "❌ Скасовано.");
      return;
    }

    // ===== Flows =====
    if (session.flow === "register") {
      if (session.step === "name") {
        const name = raw.trim();
        if (name.length < 2) {
          await safeSend(bot, chatId, "Імʼя занадто коротке. Введіть ще раз:", { reply_markup: cancelKeyboard() });
          return;
        }
        await setSession(chatId, { step: "email", temp: { ...session.temp, name } });
        await safeSend(bot, chatId, "Введіть email:", { reply_markup: cancelKeyboard() });
        return;
      }

      if (session.step === "email") {
        const email = raw.trim().toLowerCase();
        if (!isValidEmail(email)) {
          await safeSend(bot, chatId, "Некоректний email. Введіть ще раз:", { reply_markup: cancelKeyboard() });
          return;
        }
        await setSession(chatId, { step: "password", temp: { ...session.temp, email } });
        await safeSend(bot, chatId, "Введіть пароль (мінімум 6 символів):", { reply_markup: cancelKeyboard() });
        return;
      }

      if (session.step === "password") {
        const password = raw; // без trim()
        if (!isStrongEnoughPassword(password)) {
          await safeSend(bot, chatId, "Пароль має бути мінімум 6 символів. Введіть ще раз:", { reply_markup: cancelKeyboard() });
          return;
        }

        const name = session?.temp?.name;
        const email = session?.temp?.email;

        try {
          const r = await axios.post(
            `${apiBase}/api/auth/register`,
            { name, email, password, role: "user" }, // роль не даємо обирати
            { timeout: 15000 }
          );

          const user = r?.data?.user || null;

          // ВАЖЛИВО: твій бекенд повертає user.id
          const userId = user?.id || user?._id;
          const tokenJwt = r?.data?.token || null;

          if (!userId) {
            await resetFlow(chatId);
            const s2 = await ensureSession(chatId);
            await showMenu(bot, chatId, s2, "Користувач створений, але сервер не повернув id. Спробуйте /login.");
            return;
          }

          await setSession(chatId, {
            userId: String(userId),
            token: tokenJwt,
            role: "user",
            flow: null,
            step: null,
            temp: { name: null, email: null },
          });

          const s2 = await ensureSession(chatId);
          await showMenu(bot, chatId, s2, `✅ Реєстрація успішна. Ви: ${user?.name || email}`);
        } catch (e) {
          const msgErr = e?.response?.data?.message || "Не вдалося зареєструватися.";
          await safeSend(bot, chatId, `${msgErr}\n\nВведіть інший email або натисніть ❌ Скасувати`, { reply_markup: cancelKeyboard() });
        }
        return;
      }
    }

    if (session.flow === "login") {
      if (session.step === "email") {
        const email = raw.trim().toLowerCase();
        if (!isValidEmail(email)) {
          await safeSend(bot, chatId, "Некоректний email. Введіть ще раз:", { reply_markup: cancelKeyboard() });
          return;
        }
        await setSession(chatId, { step: "password", temp: { ...session.temp, email } });
        await safeSend(bot, chatId, "Введіть пароль:", { reply_markup: cancelKeyboard() });
        return;
      }

      if (session.step === "password") {
        const password = raw; // без trim()
        const email = session?.temp?.email;

        try {
          const r = await axios.post(
            `${apiBase}/api/auth/login`,
            { email, password },
            { timeout: 15000 }
          );

          const user = r?.data?.user || null;
          const userId = user?.id || user?._id;
          const tokenJwt = r?.data?.token || null;

          if (!userId) {
            await safeSend(bot, chatId, "Не вдалося увійти (сервер не повернув id). ❌ Скасувати", { reply_markup: cancelKeyboard() });
            return;
          }

          await setSession(chatId, {
            userId: String(userId),
            token: tokenJwt,
            role: String(user?.role || "user"),
            flow: null,
            step: null,
            temp: { name: null, email: null },
          });

          const s2 = await ensureSession(chatId);
          await showMenu(bot, chatId, s2, `✅ Вхід успішний. Ви: ${user?.name || email}`);
        } catch (e) {
          const msgErr = e?.response?.data?.message || "Невірні дані авторизації";
          await safeSend(bot, chatId, `${msgErr}\n\nСпробуйте ще раз або натисніть ❌ Скасувати`, { reply_markup: cancelKeyboard() });
        }
        return;
      }
    }

    // Support flow OR default = send to admin
    if (session.flow === "support" && session.step === "message") {
      await resetFlow(chatId); // після відправки — виходимо з флоу
    }

    // ===== Default: будь-який текст = повідомлення в підтримку =====
    try {
      const senderId = session?.userId ? String(session.userId) : tgGuestId(chatId);

      const newMsg = await Message.create({
        sender: senderId,
        receiver: String(adminId),
        text: raw,
        isGuest: !session?.userId,
        isRead: false,
      });

      io.to(String(adminId)).emit("receive_message", newMsg);

      const s2 = await ensureSession(chatId);
      await showMenu(bot, chatId, s2, "✅ Повідомлення відправлено оператору.");
    } catch (e) {
      console.error("TG save message error:", e?.message || e);
      const s2 = await ensureSession(chatId);
      await showMenu(bot, chatId, s2, "Помилка відправки. Спробуйте ще раз.");
    }
  });

  console.log("✅ Telegram bot started (polling)");
  return { bot };
}

/**
 * Використовуй це, коли адмін відповідає з сайту:
 * - receiverId = tg:<chatId> => шлемо напряму
 * - receiverId = userId => шукаємо TgSession по userId і шлемо в його chatId
 */
export async function sendToTelegram({ bot, receiverId, text }) {
  if (!bot) return;
  const clean = String(text || "").trim();
  if (!clean) return;

  if (isTgGuestId(receiverId)) {
    const chatId = tgChatIdFromGuestId(receiverId);
    if (chatId) await bot.sendMessage(chatId, clean);
    return;
  }

  const sess = await getSessionByUserId(receiverId);
  if (sess?.chatId) {
    await bot.sendMessage(sess.chatId, clean);
  }
}
