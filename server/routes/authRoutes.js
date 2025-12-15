import express from "express";
import { registerUser, loginUser, getMe } from "../controllers/authController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { getAdminDashboard } from "../controllers/adminController.js";

const router = express.Router();


// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/forgot-password
router.post("/forgot-password", (req, res) => {
  res.status(200).json({ message: "Forgot password route works" });
});

// POST /api/auth/login
router.post("/login", loginUser);

// GET /api/auth/me
router.get("/me", protect, getMe);

// GET /api/auth/dashboard — доступно тільки адмінам
router.get("/admin/dashboard", protect, admin, getAdminDashboard);

export default router;
