import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Category from "../models/Category.js";

const router = express.Router();

// === Базова папка для всіх категорій ===
const baseUploadPath = path.join(process.cwd(), "../client/public/UPLOAD/categories");

// === Функція створення папки категорії ===
const ensureCategoryFolder = (categoryKey) => {
  const folderPath = path.join(baseUploadPath, categoryKey);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
};

// === Multer налаштування ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { category } = req.body;
    if (!category) return cb(new Error("Category key is required"));
    const folderPath = ensureCategoryFolder(category); // створюємо папку під категорію
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ===================================================================
// Отримати всі категорії
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Помилка при отриманні категорій" });
  }
});

// ===================================================================
// Додати категорію
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { category, name_ua, name_en, imageUrl } = req.body;

    if (!category || !name_ua || !name_en) {
      return res.status(400).json({ message: "Ключ та обидві назви категорії обов'язкові." });
    }

    // Створюємо папку під категорію
    const folderPath = ensureCategoryFolder(category);

    // Зберігаємо шлях до зображення
    const image = req.file
      ? `/UPLOAD/categories/${category}/${req.file.filename}`
      : imageUrl?.trim() || "";

    // Створюємо категорію і зберігаємо шлях до папки в MongoDB
    const newCategory = new Category({
      category,
      image,
      names: { ua: name_ua, en: name_en },
      folderPath, // шлях до папки
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    console.error("❌ Помилка при створенні категорії:", err);
    if (err.code === 11000) return res.status(409).json({ message: "Категорія з таким ключем вже існує." });
    res.status(500).json({ message: "Помилка при створенні категорії" });
  }
});

// ===================================================================
// Оновити категорію
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { category, name_ua, name_en, imageUrl } = req.body;

    const updateData = { category };
    if (name_ua && name_en) updateData.names = { ua: name_ua, en: name_en };

    if (req.file) updateData.image = `/UPLOAD/categories/${category}/${req.file.filename}`;
    else if (imageUrl?.trim()) updateData.image = imageUrl;

    // Оновлюємо папку категорії, якщо змінився ключ
    if (category) updateData.folderPath = ensureCategoryFolder(category);

    const updated = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: "Категорію не знайдено" });

    res.json(updated);
  } catch (err) {
    console.error("❌ Помилка при оновленні категорії:", err);
    res.status(500).json({ message: "Помилка при оновленні категорії" });
  }
});

// ===================================================================
// Видалити категорію
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Категорію не знайдено" });

    // Видалення папки категорії на сервері
    const folderPath = path.join(baseUploadPath, deleted.category);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }

    res.json({ message: "Категорію успішно видалено" });
  } catch (err) {
    console.error("❌ Помилка при видаленні категорії:", err);
    res.status(500).json({ message: "Помилка при видаленні категорії" });
  }
});

export default router;
