// server/controllers/adminController.js
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import User from "../models/userModel.js";
import Message from "../models/Message.js";

export const getAdminDashboard = async (req, res) => {
  try {
    const [products, categories, users, chatConversations] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      User.countDocuments(),
      // Під "conversations" тут зробимо приблизну метрику:
      // якщо є conversationId — рахуємо distinct, інакше 0.
      (async () => {
        const hasConversationId =
          Message?.schema?.path?.("conversationId") || Message?.schema?.path?.("conversation");
        if (!hasConversationId) return 0;

        const field = Message.schema.path("conversationId") ? "conversationId" : "conversation";
        const ids = await Message.distinct(field);
        return ids.length;
      })(),
    ]);

    res.json({
      products,
      categories,
      users,
      chatConversations,
      ts: Date.now(),
    });
  } catch (error) {
    console.error("[getAdminDashboard] error:", error);
    res.status(500).json({ message: "Помилка сервера" });
  }
};
