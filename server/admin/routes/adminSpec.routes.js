import { Router } from "express";
import {
  listFields, createField, updateField, deleteField,
  listTemplates, createTemplate, updateTemplate, deleteTemplate,
  getDictionaries, upsertDictionaries
} from "../controllers/adminSpec.controller.js";

const router = Router();

// fields
router.get("/fields", listFields);
router.post("/fields", createField);
router.put("/fields/:id", updateField);
router.delete("/fields/:id", deleteField);

// templates
router.get("/templates", listTemplates);
router.post("/templates", createTemplate);
router.put("/templates/:id", updateTemplate);
router.delete("/templates/:id", deleteTemplate);

// dictionaries (default)
router.get("/dictionaries", getDictionaries);
router.put("/dictionaries", upsertDictionaries);

export default router;
