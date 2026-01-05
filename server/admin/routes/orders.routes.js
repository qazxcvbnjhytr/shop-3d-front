// server/admin/routes/settings.routes.js
import { Router } from "express";

const router = Router();

// під налаштування адмінки (наприклад, конфіг фільтрів, довідники)
router.get("/", async (req, res) => {
  res.json({ ok: true, message: "settings placeholder" });
});

export default router;
