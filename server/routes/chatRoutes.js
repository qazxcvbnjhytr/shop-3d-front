import express from "express";
import User from "../models/userModel.js";

const router = express.Router();

/**
 * Повертаємо ID адміна, який виступає “підтримкою”.
 * Варіант 1: беремо першого user.role === "admin"
 * (краще: мати env SUPPORT_ADMIN_EMAIL або SUPPORT_ADMIN_ID)
 */
router.get("/admin-id", async (req, res) => {
  try {
    const supportEmail = process.env.SUPPORT_ADMIN_EMAIL;

    let admin = null;

    if (supportEmail) {
      admin = await User.findOne({ email: supportEmail, role: "admin" }).select("_id");
    }

    if (!admin) {
      admin = await User.findOne({ role: "admin" }).select("_id");
    }

    if (!admin) {
      return res.status(404).json({ message: "No admin found" });
    }

    res.json({ adminId: String(admin._id) });
  } catch (e) {
    res.status(500).json({ message: "Failed to get admin id" });
  }
});

export default router;
