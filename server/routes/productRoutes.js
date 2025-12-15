// routes/productRoutes.js (ПОВНА ФІНАЛЬНА ВЕРСІЯ)

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// 🔥 Імпортуємо всі контролери, включаючи НОВИЙ updateProduct
import { 
    getProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct 
} from "../controllers/productController.js"; 
import { protect } from "../middleware/authMiddleware.js"; // Захист для адмінських дій

const router = express.Router();

// --- НАЛАШТУВАННЯ MULTER ДЛЯ ЗБЕРІГАННЯ ФАЙЛІВ ТОВАРІВ ---
const baseUploadPath = path.join(process.cwd(), "public/uploads/products");

// Функція, що створює папку, якщо її немає (важливо для Multer)
const ensureCategoryFolder = (categoryKey) => {
    const folderPath = path.join(baseUploadPath, categoryKey);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    return folderPath;
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Multer очікує поле 'category' у req.body.
        let category = req.body.category || 'uncategorized';
        const folderPath = ensureCategoryFolder(category);
        cb(null, folderPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        // Зберігаємо у форматі: 'imageFile-12345678.jpg'
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({ storage });
// --- КІНЕЦЬ MULTER ---

// =======================
// 🔥 МАРШРУТИ ТОВАРІВ 🔥
// =======================

// 1. GET /api/products — Отримати ВСІ товари (або з фільтром по категорії)
router.get("/", getProducts);

// 2. GET /api/products/:id — Отримати ОДИН товар
router.get("/:id", getProductById);

// 3. POST /api/products — Створити товар (Тільки для авторизованих)
router.post("/", 
  protect, 
  upload.fields([
    { name: "images", maxCount: 5 }, // 🔥 Нове ім'я поля для багатьох фото
    { name: "modelFile", maxCount: 1 }
  ]), 
  createProduct
);

router.put("/:id", 
  protect, 
  upload.fields([
    { name: "images", maxCount: 5 }, // 🔥 Нове ім'я поля для багатьох фото
    { name: "modelFile", maxCount: 1 }
  ]), 
  updateProduct 
);

// 5. DELETE /api/products/:id — Видалити товар
router.delete("/:id", protect, deleteProduct);

export default router;