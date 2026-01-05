import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getCart,
  addToCart,
  setQty,
  removeItem,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

// ✅ захищаємо все одразу (щоб не було дірок)
router.use(protect);

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/qty", setQty);
router.delete("/item/:productId", removeItem);
router.delete("/clear", clearCart);

export default router;
