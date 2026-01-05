import mongoose from "mongoose";

const TgSessionSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true, unique: true },

    userId: { type: String, default: null }, // Mongo User ID (string)
    token: { type: String, default: null },
    role: { type: String, default: "guest" }, // guest/user/admin

    flow: { type: String, default: null }, // register/login/support/null
    step: { type: String, default: null }, // name/email/password/message

    temp: {
      name: { type: String, default: null },
      email: { type: String, default: null },
    },
  },
  { timestamps: true }
);

export const TgSession =
  mongoose.models.TgSession || mongoose.model("TgSession", TgSessionSchema);

export async function ensureSession(chatId) {
  const id = String(chatId);
  let s = await TgSession.findOne({ chatId: id });
  if (!s) s = await TgSession.create({ chatId: id, role: "guest" });
  return s;
}

export async function getSession(chatId) {
  return TgSession.findOne({ chatId: String(chatId) });
}

export async function setSession(chatId, patch) {
  return TgSession.findOneAndUpdate(
    { chatId: String(chatId) },
    { $set: patch },
    { upsert: true, new: true }
  );
}

export async function resetFlow(chatId) {
  return setSession(chatId, {
    flow: null,
    step: null,
    temp: { name: null, email: null },
  });
}

export async function logoutSession(chatId) {
  return setSession(chatId, {
    userId: null,
    token: null,
    role: "guest",
    flow: null,
    step: null,
    temp: { name: null, email: null },
  });
}

export async function getSessionByUserId(userId) {
  return TgSession.findOne({ userId: String(userId) });
}
