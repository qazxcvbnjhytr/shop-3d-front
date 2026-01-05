// server/admin/routes/settings.routes.js
import { Router } from "express";

const router = Router();

/**
 * Мінімальна заглушка, щоб сервер не падав.
 * Пізніше сюди можна додати реальні налаштування (валюти, довідники, конфіги фільтрів тощо).
 */

// GET /api/admin/settings
router.get("/", async (req, res) => {
  res.json({
    ok: true,
    data: {},
  });
});

// PUT /api/admin/settings
router.put("/", async (req, res) => {
  // Тут можна зберігати конфіг у MongoDB (колекція Settings)
  res.json({
    ok: true,
    saved: req.body ?? {},
  });
});

export default router;
