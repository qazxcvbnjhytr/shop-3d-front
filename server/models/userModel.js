import mongoose from "mongoose";

// Схема для одного лайка
const likeSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  
  // 🔥🔥🔥 ВИПРАВЛЕНО ТУТ 🔥🔥🔥
  // Замість String ставимо об'єкт, щоб приймати { ua: "...", en: "..." }
  productName: {
    ua: { type: String, default: "" },
    en: { type: String, default: "" }
  },
  
  productCategory: { type: String, default: "" },
  productImage: { type: String, default: "" },
  discount: { type: Number, default: 0 },
  // Я додав ціну, бо вона часто потрібна в кабінеті ("ціна зі знижкою")
  price: { type: Number, default: 0 } 
}, { _id: false }); // _id: false це правильно, щоб не плодити зайві ID

// Основна схема юзера
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  isOnline: { type: Boolean, default: false },
  
  // Масив лайків, що використовує схему вище
  likes: [likeSchema] 
}, { timestamps: true });

// Метод для перевірки лайку
userSchema.methods.isLiked = function(productId) {
  return this.likes.some(like => like.productId === String(productId));
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;