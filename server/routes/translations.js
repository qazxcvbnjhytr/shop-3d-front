import express from "express";
import { getTranslationsByLang } from "../controllers/translationsController.js";

const router = express.Router();

// GET /api/translations/:lang
router.get("/:lang", getTranslationsByLang);

export default router;
