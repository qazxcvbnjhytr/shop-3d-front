// server/admin/routes/categories.routes.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

import Category from "../../models/Category.js";

const router = Router();

const baseUploadPath = path.join(process.cwd(), "public/uploads/categories");

function ensureFolder(categoryKey) {
  const safe = String(categoryKey || "unknown").trim() || "unknown";
  const folder = path.join(baseUploadPath, safe);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  return folder;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || "unknown";
    cb(null, ensureFolder(category));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

function fileToPublicPath(absPath) {
  const rel = absPath.split(path.join("public")).pop().replaceAll("\\", "/");
  return rel.startsWith("/") ? rel : `/${rel}`;
}

// LIST
router.get("/", async (req, res) => {
  try {
    const list = await Category.find().sort({ order: 1, createdAt: -1 }).lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: "ADMIN_CATEGORIES_LIST_ERROR" });
  }
});

// CREATE
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { category, name_ua, name_en, order = 0, imageUrl = "" } = req.body;

    if (!category || !name_ua || !name_en) {
      return res.status(400).json({ message: "category, name_ua, name_en required" });
    }

    const image = req.file
      ? fileToPublicPath(req.file.path) // /uploads/categories/<key>/<file>
      : String(imageUrl || "").trim();

    const doc = await Category.create({
      category,
      names: { ua: name_ua, en: name_en },
      image,
      order: Number(order) || 0,
      children: [],
      folderPath: ensureFolder(category),
    });

    res.status(201).json(doc);
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ message: "DUPLICATE_CATEGORY_KEY" });
    res.status(400).json({ message: "ADMIN_CATEGORY_CREATE_ERROR" });
  }
});

// UPDATE BY ID
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "INVALID_ID" });
    }

    const { category, name_ua, name_en, order, imageUrl } = req.body;

    const update = {};
    if (category) update.category = category;
    if (name_ua && name_en) update.names = { ua: name_ua, en: name_en };
    if (order != null) update.order = Number(order) || 0;

    if (req.file) update.image = fileToPublicPath(req.file.path);
    else if (imageUrl != null) update.image = String(imageUrl).trim();

    if (category) update.folderPath = ensureFolder(category);

    const updated = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) return res.status(404).json({ message: "NOT_FOUND" });

    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: "ADMIN_CATEGORY_UPDATE_ERROR" });
  }
});

// DELETE BY ID
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "INVALID_ID" });
    }

    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "NOT_FOUND" });

    // видалити папку uploads/categories/<key>
    const folder = path.join(baseUploadPath, deleted.category);
    if (fs.existsSync(folder)) fs.rmSync(folder, { recursive: true, force: true });

    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: "ADMIN_CATEGORY_DELETE_ERROR" });
  }
});

export default router;
