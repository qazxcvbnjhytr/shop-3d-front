import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

// Отримати історію повідомлень між двома користувачами
router.get("/:userId1/:userId2", async (req, res) => {
  const { userId1, userId2 } = req.params;
  try {
    const history = await Message.find({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 }
      ]
    }).sort({ createdAt: 1 }); // Сортуємо від старих до нових
    
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Помилка сервера" });
  }
});

// Позначити повідомлення як прочитані (для адмінки)
router.patch("/read/:senderId/:receiverId", async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.senderId, receiver: req.params.receiverId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Помилка" });
  }
});

export default router;