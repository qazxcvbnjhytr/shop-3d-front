import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { getAdminDashboard } from "../controllers/adminController.js";
import User from "../models/userModel.js";

const router = express.Router();

// 📊 GET /api/admin/dashboard — загальна інформація
router.get("/dashboard", protect, admin, getAdminDashboard);

// 👥 GET /api/admin/users — отримати всіх користувачів
router.get("/users", protect, admin, async (req, res) => {
  try {
    const users = await User.find().select("-password"); // не показуємо пароль
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Помилка сервера" });
  }
});

// ✏️ PATCH /api/admin/users/:id — змінити роль користувача
router.patch("/users/:id", protect, admin, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "Користувача не знайдено" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Помилка сервера" });
  }
});

// ❌ DELETE /api/admin/users/:id — видалити користувача
router.delete("/users/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Користувача не знайдено" });

    await user.deleteOne();
    res.json({ message: "Користувача видалено" });
  } catch (error) {
    res.status(500).json({ message: "Помилка сервера" });
  }
});

export default router;
