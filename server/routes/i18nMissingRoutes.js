import express from 'express';

const router = express.Router();

// ✅ Заглушка/мінімальний роут
// Можеш потім підключити контролер, який зберігає "missing translation keys" у MongoDB
router.get('/', (_req, res) => {
  res.json({ ok: true, message: 'i18nMissingRoutes is active' });
});

router.post('/', (req, res) => {
  // очікуємо { key, lang, page, meta }
  res.status(201).json({ ok: true, received: req.body || {} });
});

export default router;
