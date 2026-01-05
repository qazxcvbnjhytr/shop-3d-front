// server/admin/routes/users.routes.js
import { Router } from "express";
import mongoose from "mongoose";
import User from "../../models/userModel.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch {
    res.status(500).json({ message: "ADMIN_USERS_LIST_ERROR" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "INVALID_ID" });
    }
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "NOT_FOUND" });
    res.json(user);
  } catch {
    res.status(400).json({ message: "ADMIN_USER_UPDATE_ERROR" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "INVALID_ID" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "NOT_FOUND" });
    await user.deleteOne();
    res.json({ ok: true });
  } catch {
    res.status(400).json({ message: "ADMIN_USER_DELETE_ERROR" });
  }
});

export default router;
