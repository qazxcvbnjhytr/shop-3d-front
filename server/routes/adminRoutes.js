import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import bcrypt from "bcryptjs";

import { protect, admin } from "../middleware/authMiddleware.js";

import Product from "../models/Product.js";
import Category from "../models/Category.js";
import User from "../models/userModel.js";
import Message from "../models/Message.js";

const router = express.Router();

/** =========================
 * Helpers
 * ========================= */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const safeSlug = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const toBool = (v) => String(v) === "true" || String(v) === "1";

/** =========================
 * Multer (uploads)
 * =========================
 * Product:
 *  - images[]  => /server/uploads/products/images-...
 *  - modelFile => /server/uploads/products/models-...
 *
 * Category:
 *  - image     => /server/uploads/categories/...
 */
const rootUploads = path.join(process.cwd(), "uploads");
const productUploads = path.join(rootUploads, "products");
const categoryUploads = path.join(rootUploads, "categories");

ensureDir(productUploads);
ensureDir(categoryUploads);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "image") return cb(null, categoryUploads);
    // images / modelFile
    return cb(null, productUploads);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const base = safeSlug(path.basename(file.originalname || "file", ext));
    cb(null, `${file.fieldname}-${Date.now()}-${base}${ext || ""}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
});

/** =========================
 * DASHBOARD
 * ========================= */
router.get("/dashboard", protect, admin, async (req, res) => {
  try {
    const [products, categories, users, conversations] = await Promise.all([
      Product.countDocuments({}),
      Category.countDocuments({}),
      User.countDocuments({}),
      Message.distinct("_id").then(() => 0).catch(() => 0), // fallback якщо інша схема
    ]);

    res.json({
      products,
      categories,
      users,
      chatConversations: conversations,
    });
  } catch (e) {
    res.status(500).json({ message: "Помилка сервера" });
  }
});

/** =========================
 * PRODUCTS CRUD
 * ========================= */
router.get("/products", protect, admin, async (req, res) => {
  try {
    const items = await Product.find({})
      .sort({ createdAt: -1 })
      .lean();
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Failed to load products" });
  }
});

router.post(
  "/products",
  protect,
  admin,
  upload.fields([
    { name: "images", maxCount: 20 },
    { name: "modelFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const body = req.body || {};

      const name = JSON.parse(body.name || "{}");
      const description = JSON.parse(body.description || "{}");

      const styleKeys = JSON.parse(body.styleKeys || "[]");
      const colorKeys = JSON.parse(body.colorKeys || "[]");
      const roomKeys = JSON.parse(body.roomKeys || "[]");
      const collectionKeys = JSON.parse(body.collectionKeys || "[]");
      const featureKeys = JSON.parse(body.featureKeys || "[]");

      const specifications = JSON.parse(body.specifications || "{}");

      const imageFiles = req.files?.images || [];
      const modelFiles = req.files?.modelFile || [];

      const images = imageFiles.map((f) => `/uploads/products/${f.filename}`);
      const modelUrl = modelFiles[0] ? `/uploads/products/${modelFiles[0].filename}` : "";

      const doc = await Product.create({
        name,
        description,
        slug: String(body.slug || "").trim(),
        category: String(body.category || "").trim(),
        subCategory: String(body.subCategory || "").trim(),
        typeKey: String(body.typeKey || "").trim(),
        price: Number(body.price || 0),
        discount: Number(body.discount || 0),
        inStock: toBool(body.inStock),
        stockQty: Number(body.stockQty || 0),
        status: String(body.status || "active"),
        styleKeys,
        colorKeys,
        roomKeys,
        collectionKeys,
        featureKeys,
        specifications,
        images,
        modelUrl,
      });

      res.status(201).json(doc);
    } catch (e) {
      console.error("[ADMIN products POST]", e);
      res.status(400).json({ message: "Create product failed" });
    }
  }
);

router.put(
  "/products/:id",
  protect,
  admin,
  upload.fields([
    { name: "images", maxCount: 20 },
    { name: "modelFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const body = req.body || {};
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });

      const name = JSON.parse(body.name || "{}");
      const description = JSON.parse(body.description || "{}");

      const styleKeys = JSON.parse(body.styleKeys || "[]");
      const colorKeys = JSON.parse(body.colorKeys || "[]");
      const roomKeys = JSON.parse(body.roomKeys || "[]");
      const collectionKeys = JSON.parse(body.collectionKeys || "[]");
      const featureKeys = JSON.parse(body.featureKeys || "[]");

      const specifications = JSON.parse(body.specifications || "{}");

      // keepImages comes only on edit in your frontend
      let keepImages = [];
      try {
        keepImages = JSON.parse(body.keepImages || "[]");
      } catch {
        keepImages = [];
      }

      const newImageFiles = req.files?.images || [];
      const newImages = newImageFiles.map((f) => `/uploads/products/${f.filename}`);

      const modelFiles = req.files?.modelFile || [];
      const newModel = modelFiles[0] ? `/uploads/products/${modelFiles[0].filename}` : null;

      product.name = name;
      product.description = description;
      product.slug = String(body.slug || "").trim();
      product.category = String(body.category || "").trim();
      product.subCategory = String(body.subCategory || "").trim();
      product.typeKey = String(body.typeKey || "").trim();
      product.price = Number(body.price || 0);
      product.discount = Number(body.discount || 0);
      product.inStock = toBool(body.inStock);
      product.stockQty = Number(body.stockQty || 0);
      product.status = String(body.status || "active");

      product.styleKeys = styleKeys;
      product.colorKeys = colorKeys;
      product.roomKeys = roomKeys;
      product.collectionKeys = collectionKeys;
      product.featureKeys = featureKeys;
      product.specifications = specifications;

      // images: keep + new
      product.images = [...(Array.isArray(keepImages) ? keepImages : []), ...newImages];

      // modelFile: replace if new provided
      if (newModel) product.modelUrl = newModel;

      const saved = await product.save();
      res.json(saved);
    } catch (e) {
      console.error("[ADMIN products PUT]", e);
      res.status(400).json({ message: "Update product failed" });
    }
  }
);

router.delete("/products/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Delete product failed" });
  }
});

/** =========================
 * CATEGORIES CRUD (parent categories)
 * ========================= */
router.get("/categories", protect, admin, async (req, res) => {
  try {
    const items = await Category.find({}).sort({ order: 1, createdAt: -1 }).lean();
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Failed to load categories" });
  }
});

router.post("/categories", protect, admin, upload.single("image"), async (req, res) => {
  try {
    const { category, name_ua, name_en, order, imageUrl } = req.body || {};
    if (!category || !name_ua || !name_en) {
      return res.status(400).json({ message: "category + name_ua + name_en are required" });
    }

    const image = req.file
      ? `/uploads/categories/${req.file.filename}`
      : (String(imageUrl || "").trim() || "");

    const doc = await Category.create({
      category: String(category).trim(),
      names: { ua: String(name_ua || ""), en: String(name_en || "") },
      order: Number(order || 0),
      image,
      children: [],
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error("[ADMIN categories POST]", e);
    res.status(400).json({ message: "Create category failed" });
  }
});

router.put("/categories/:id", protect, admin, upload.single("image"), async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: "Category not found" });

    const { name_ua, name_en, order, imageUrl } = req.body || {};

    cat.names = {
      ua: String(name_ua ?? cat.names?.ua ?? ""),
      en: String(name_en ?? cat.names?.en ?? ""),
    };
    cat.order = Number(order ?? cat.order ?? 0);

    if (req.file) {
      cat.image = `/uploads/categories/${req.file.filename}`;
    } else if (typeof imageUrl === "string") {
      cat.image = imageUrl.trim();
    }

    const saved = await cat.save();
    res.json(saved);
  } catch (e) {
    console.error("[ADMIN categories PUT]", e);
    res.status(400).json({ message: "Update category failed" });
  }
});

router.delete("/categories/:id", protect, admin, async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: "Category not found" });

    await cat.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Delete category failed" });
  }
});

/** =========================
 * USERS CRUD
 * =========================
 * Твій UI редагує: firstName/lastName/email/role/status/password
 * В БД ти показуєш r.name, тому робимо name = first + last
 */
router.get("/users", protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: "Failed to load users" });
  }
});

router.post("/users", protect, admin, async (req, res) => {
  try {
    const { firstName, lastName, email, role, status, password } = req.body || {};
    if (!email || !firstName || !password) {
      return res.status(400).json({ message: "Email, firstName and password are required" });
    }

    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const name = `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim();

    const hashed = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name,
      email: String(email).toLowerCase().trim(),
      password: hashed,
      role: role || "user",
      status: status || "active",
    });

    const safe = await User.findById(user._id).select("-password").lean();
    res.status(201).json(safe);
  } catch (e) {
    console.error("[ADMIN users POST]", e);
    res.status(400).json({ message: "Create user failed" });
  }
});

router.put("/users/:id", protect, admin, async (req, res) => {
  try {
    const { firstName, lastName, email, role, status, password } = req.body || {};
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (typeof firstName === "string" || typeof lastName === "string") {
      const name = `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim();
      if (name) user.name = name;
    }

    if (typeof email === "string" && email.trim()) user.email = email.toLowerCase().trim();
    if (typeof role === "string" && role.trim()) user.role = role.trim();
    if (typeof status === "string" && status.trim()) user.status = status.trim();

    // якщо міняємо пароль — хешуємо
    if (typeof password === "string" && password.trim()) {
      user.password = await bcrypt.hash(password.trim(), 10);
    }

    await user.save();

    const safe = await User.findById(user._id).select("-password").lean();
    res.json(safe);
  } catch (e) {
    console.error("[ADMIN users PUT]", e);
    res.status(400).json({ message: "Update user failed" });
  }
});

router.delete("/users/:id", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Delete user failed" });
  }
});

/** =========================
 * CHAT CONVERSATIONS
 * =========================
 * Проста агрегація по парі (from,to) + lastMessage
 * Якщо в тебе інша схема Message — скажеш, підправлю під точні поля.
 */
router.get("/chat-conversations", protect, admin, async (req, res) => {
  try {
    // Очікуємо поля: from, to, text, createdAt
    const convs = await Message.aggregate([
      {
        $project: {
          fromStr: { $toString: "$from" },
          toStr: { $toString: "$to" },
          text: "$text",
          createdAt: "$createdAt",
        },
      },
      {
        $addFields: {
          a: {
            $cond: [{ $gt: ["$fromStr", "$toStr"] }, "$toStr", "$fromStr"],
          },
          b: {
            $cond: [{ $gt: ["$fromStr", "$toStr"] }, "$fromStr", "$toStr"],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { a: "$a", b: "$b" },
          lastMessage: { $first: "$text" },
          updatedAt: { $first: "$createdAt" },
          users: { $first: ["$a", "$b"] },
        },
      },
      { $sort: { updatedAt: -1 } },
      { $limit: 100 },
    ]);

    res.json(convs);
  } catch (e) {
    console.error("[ADMIN chat-conversations]", e);
    res.status(500).json({ message: "Failed to load conversations" });
  }
});

export default router;
