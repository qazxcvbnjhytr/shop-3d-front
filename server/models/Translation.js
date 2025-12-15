import mongoose from "mongoose";

const TranslationSchema = new mongoose.Schema(
  {
    lang: {
      type: String,
      required: true,
      unique: true, // одна мова = один документ
      enum: ["ua", "en"]
    }
  },
  {
    strict: false, // 🔥 дозволяє будь-які секції: header, footer, auth тощо
    timestamps: true
  }
);

export default mongoose.model("Translation", TranslationSchema);
