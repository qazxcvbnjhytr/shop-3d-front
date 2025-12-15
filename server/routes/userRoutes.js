// routes/user.js
import express from "express";
import User from "../models/userModel.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Оновити онлайн-статус
router.patch("/status", authMiddleware, async (req, res) => {
  try {
    const { isOnline } = req.body;

    if (typeof isOnline !== "boolean") {
      return res.status(400).json({ message: "isOnline має бути boolean" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { isOnline },
      { new: true }
    );

    res.json({ message: "Статус оновлено", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Помилка оновлення статусу" });
  }
});

export default router;
