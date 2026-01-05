// server/admin/routes/subcategories.routes.js
import { Router } from "express";
import SubCategory from "../../models/SubCategory.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const list = await SubCategory.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: "SUBCATEGORIES_LIST_ERROR" });
  }
});

router.post("/", async (req, res) => {
  try {
    const created = await SubCategory.create(req.body);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ message: "SUBCATEGORY_CREATE_ERROR" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const updated = await SubCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "NOT_FOUND" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: "SUBCATEGORY_UPDATE_ERROR" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await SubCategory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "NOT_FOUND" });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: "SUBCATEGORY_DELETE_ERROR" });
  }
});

export default router;
