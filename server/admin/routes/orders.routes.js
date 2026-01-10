// server/admin/routes/orders.routes.js
import express from "express";
import { protect, admin } from "../../middleware/authMiddleware.js";
import {
  adminListOrders,
  adminGetOrder,
  adminPatchOrder,
  adminCancelOrder,
  adminDeleteOrder,
} from "../controllers/orders.controller.js";

const router = express.Router();

// /api/admin/orders
router.get("/", protect, admin, adminListOrders);
router.get("/:id", protect, admin, adminGetOrder);
router.patch("/:id", protect, admin, adminPatchOrder);
router.post("/:id/cancel", protect, admin, adminCancelOrder);
router.delete("/:id", protect, admin, adminDeleteOrder);

export default router;
