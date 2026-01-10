import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    // ВАЖЛИВО: зберігаємо як STRING, бо у тебе sender/receiver приходять як строки
    sender: { type: String, required: true, index: true },
    receiver: { type: String, required: true, index: true },

    text: { type: String, required: true, trim: true },

    // Якщо пише “гість” (без акаунта) — true
    isGuest: { type: Boolean, default: false },

    // Для адміна: непрочитані повідомлення від партнера
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
