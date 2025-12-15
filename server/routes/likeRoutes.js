// server/routes/likeRoutes.js

import express from "express";
// 🔥 КРИТИЧНИЙ ФІКС 1: Імпортуємо toggleLike з authController
import { toggleLike, getMe } from "../controllers/authController.js"; 
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔥 УСУВАЄМО ReferenceError
// Тимчасово використовуємо getMe, оскільки він захищений і повертає user, 
// який містить likes, що має задовольнити LikesContext.jsx.
router.get("/", protect, getMe); 

// 2. POST РОУТ: Для додавання/видалення (Він у нас вже працює)
router.post("/", protect, toggleLike);

export default router;