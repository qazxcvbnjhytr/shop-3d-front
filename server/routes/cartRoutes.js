import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getCart, addToCart, setQty, removeItem, clearCart } from "../controllers/cartController.js";

const router = express.Router();

router.get("/", protect, getCart);
router.post("/add", protect, addToCart);
router.put("/qty", protect, setQty);
router.delete("/item/:productId", protect, removeItem);
router.delete("/clear", protect, clearCart);

export default router;
