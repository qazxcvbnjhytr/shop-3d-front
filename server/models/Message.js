import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    text: { type: String, required: true },
    isGuest: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false } // 🔥 Статус прочитання
  },
  { timestamps: true }
);

export default mongoose.model("Message", MessageSchema);