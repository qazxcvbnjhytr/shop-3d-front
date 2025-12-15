import mongoose from "mongoose";

const LikeSchema = new mongoose.Schema({
  // Прив'язка до користувача
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Прив'язка до товару (ID з MongoDB)
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  // Зберігаємо назву об'єктом, бо в тебе мультимовність
  productName: {
    ua: { type: String },
    en: { type: String }
  },
  productImage: { type: String },
  productCategory: { type: String },
  price: { type: Number },
  discount: { type: Number, default: 0 },
}, { timestamps: true });

// Гарантуємо, що один юзер не може лайкнути один товар двічі
LikeSchema.index({ user: 1, product: 1 }, { unique: true });

export default mongoose.model("Like", LikeSchema);