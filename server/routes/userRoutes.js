import express from "express";
import User from "../models/userModel.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// PATCH /api/users/status
router.patch("/status", protect, async (req, res) => {
  try {
    const { status } = req.body; // наприклад: "online"/"offline"
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const updated = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select("-password");

    return res.json(updated);
  } catch (e) {
    console.error("PATCH /users/status error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
