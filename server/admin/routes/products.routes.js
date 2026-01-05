// server/admin/routes/products.routes.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

import Product from "../../models/Product.js";

const router = Router();

const baseUploadPath = path.join(process.cwd(), "public/uploads/products");

function ensureFolder(key) {
  const safe = String(key || "uncategorized").trim() || "uncategorized";
  const folder = path.join(baseUploadPath, safe);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  return folder;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || "uncategorized";
    cb(null, ensureFolder(category));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  },
});

const upload = multer({ storage });

function normalizeBody(req) {
  // multer form-data все приходить як string
  const b = req.body || {};
  const pickObj = (val) => {
    if (val == null) return undefined;
    if (typeof val === "object") return val;
    const s = String(val);
    try { return JSON.parse(s); } catch { return undefined; }
  };

  const n = {};

  // name / description можуть прийти як JSON-рядок або як вкладені поля name[ua]
  n.name = pickObj(b.name) || {
    ua: b["name[ua]"] ?? b.name_ua ?? "",
    en: b["name[en]"] ?? b.name_en ?? "",
  };

  n.description = pickObj(b.description) || {
    ua: b["description[ua]"] ?? b.desc_ua ?? "",
    en: b["description[en]"] ?? b.desc_en ?? "",
  };

  n.slug = (b.slug ?? "").trim();
  n.category = (b.category ?? "").trim();
  n.subCategory = (b.subCategory ?? "").trim() || null;
  n.typeKey = (b.typeKey ?? "").trim();

  // arrays
  const arr = (x) => {
    const parsed = pickObj(x);
    if (Array.isArray(parsed)) return parsed;
    if (typeof x === "string" && x.includes(",")) return x.split(",").map((t) => t.trim()).filter(Boolean);
    return Array.isArray(x) ? x : [];
  };

  n.styleKeys = arr(b.styleKeys);
  n.colorKeys = arr(b.colorKeys);
  n.roomKeys = arr(b.roomKeys);
  n.collectionKeys = arr(b.collectionKeys);
  n.featureKeys = arr(b.featureKeys);

  // specs
  n.specifications = pickObj(b.specifications) || {};

  // numbers
  n.price = Number(b.price ?? 0);
  n.discount = Number(b.discount ?? 0);

  n.inStock = String(b.inStock ?? "true") === "true";
  n.stockQty = Number(b.stockQty ?? 0);

  n.status = (b.status ?? "active").trim();

  return n;
}

function fileToPublicPath(absPath) {
  // absPath: .../server/public/uploads/products/...
  // public url: /uploads/products/...
  const rel = absPath.split(path.join("public")).pop().replaceAll("\\", "/");
  return rel.startsWith("/") ? rel : `/${rel}`;
}

// LIST
router.get("/", async (req, res) => {
  try {
    const { q, category, subCategory, status } = req.query;

    const filter = {};
    if (category) filter.category = String(category);
    if (subCategory) filter.subCategory = String(subCategory);
    if (status) filter.status = String(status);

    if (q) {
      const s = String(q).trim();
      filter.$or = [
        { "name.ua": new RegExp(s, "i") },
        { "name.en": new RegExp(s, "i") },
        { slug: new RegExp(s, "i") },
      ];
    }

    const list = await Product.find(filter).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: "ADMIN_PRODUCTS_LIST_ERROR" });
  }
});

// GET BY ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "INVALID_ID" });
    }
    const doc = await Product.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "NOT_FOUND" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: "ADMIN_PRODUCT_GET_ERROR" });
  }
});

// CREATE (multipart)
router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "modelFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const data = normalizeBody(req);

      if (!data.name?.ua || !data.name?.en) {
        return res.status(400).json({ message: "NAME_REQUIRED" });
      }
      if (!data.slug) return res.status(400).json({ message: "SLUG_REQUIRED" });
      if (!data.category) return res.status(400).json({ message: "CATEGORY_REQUIRED" });

      const files = req.files || {};
      const imgs = (files.images || []).map((f) => fileToPublicPath(f.path));
      const model = (files.modelFile || [])[0];
      const modelUrl = model ? fileToPublicPath(model.path) : "";

      const created = await Product.create({
        ...data,
        images: imgs,
        modelUrl,
      });

      res.status(201).json(created);
    } catch (e) {
      res.status(400).json({ message: "ADMIN_PRODUCT_CREATE_ERROR" });
    }
  }
);

// UPDATE (multipart)
router.put(
  "/:id",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "modelFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "INVALID_ID" });
      }

      const data = normalizeBody(req);

      const files = req.files || {};
      const newImgs = (files.images || []).map((f) => fileToPublicPath(f.path));
      const model = (files.modelFile || [])[0];
      const newModelUrl = model ? fileToPublicPath(model.path) : "";

      // якщо фронт не прислав images[] — залишаємо як є
      // якщо прислав JSON масив у body.images — беремо його
      let images = undefined;
      if (req.body?.images != null) {
        try {
          const parsed = JSON.parse(String(req.body.images));
          if (Array.isArray(parsed)) images = parsed;
        } catch {}
      }

      const update = {
        ...data,
      };

      if (images) update.images = [...images, ...newImgs];
      else if (newImgs.length) update.images = newImgs;

      if (newModelUrl) update.modelUrl = newModelUrl;

      const updated = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!updated) return res.status(404).json({ message: "NOT_FOUND" });

      res.json(updated);
    } catch (e) {
      res.status(400).json({ message: "ADMIN_PRODUCT_UPDATE_ERROR" });
    }
  }
);

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "INVALID_ID" });
    }
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "NOT_FOUND" });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: "ADMIN_PRODUCT_DELETE_ERROR" });
  }
});

export default router;
