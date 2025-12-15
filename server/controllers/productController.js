// controllers/productController.js (ПОВНА ФІНАЛЬНА ВЕРСІЯ)

import Product from "../models/Product.js";
import Category from "../models/Category.js";
import path from "path";
import fs from "fs";

// Функція для видалення файлу (для reuse)
const deleteFile = (filePath) => {
    const absolutePath = path.join(process.cwd(), "public", filePath);
    if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath, (err) => {
            if (err) console.error(`Failed to delete file: ${absolutePath}`, err);
        });
    }
};


// =======================
// 1. Отримати всі продукти
// =======================
export const getProducts = async (req, res) => {
    try {
        const filter = req.query.category ? { category: req.query.category } : {};
        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        console.error("Помилка при отриманні продуктів:", err);
        res.status(500).json({ message: "Помилка при отриманні продуктів" });
    }
};

// =======================
// 2. Отримати ОДИН продукт по ID
// =======================
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: "Товар не знайдено" });
        }
        
        res.json(product);
    } catch (err) {
        console.error("Помилка при отриманні товару:", err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: "Товар не знайдено" });
        }
        res.status(500).json({ message: "Помилка сервера" });
    }
};

// =======================
// 3. Створити новий продукт
// =======================
export const createProduct = async (req, res) => {
    try {
        const {
            name_ua, name_en, category, typeKey,
            width, height, depth, weight, bedSize,
            materialKey, manufacturerKey, warranty, manualLink,
            price, discount
        } = req.body;

        if (!name_ua || !name_en || !category) {
            return res.status(400).json({ message: "Обов'язкові поля: назва та категорія" });
        }

        const existingCategory = await Category.findOne({ category });
        if (!existingCategory) {
            return res.status(400).json({ message: "Категорія не знайдена" });
        }

        // 🔥🔥🔥 ОБРОБКА МАСИВУ ФАЙЛІВ (GALLERY) 🔥🔥🔥
        const uploadedImages = req.files?.images; 
        
        const images = uploadedImages?.length > 0 
             ? uploadedImages.map(file => `/uploads/products/${category}/${file.filename}`)
             : [];
        // 🔥🔥🔥 КІНЕЦЬ ОБРОБКИ МАСИВУ ФАЙЛІВ 🔥🔥🔥

        const modelUrl = req.files?.modelFile?.[0]
            ? `/uploads/products/${category}/${req.files.modelFile[0].filename}`
            : "";

        const product = new Product({
            name: { ua: name_ua, en: name_en },
            category,
            typeKey,
            images, // 🔥 ЗАПИСУЄМО МАСИВ images
            modelUrl,
            specifications: {
                width: parseFloat(width) || null,
                height: parseFloat(height) || null,
                depth: parseFloat(depth) || null,
                weight: parseFloat(weight) || null,
                bedSize,
                materialKey,
                manufacturerKey,
                warranty: warranty ? Number(warranty) : null,
                manualLink,
            },
            price: price ? Number(price) : null,
            discount: discount ? Number(discount) : null
        });

        await product.save();
        res.status(201).json(product);

    } catch (err) {
        console.error("Помилка при створенні продукту:", err);
        res.status(500).json({ message: "Помилка при створенні продукту" });
    }
};

// =======================
// 4. Оновити продукт
// =======================
export const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const {
            name_ua, name_en, category, typeKey,
            width, height, depth, weight, bedSize,
            materialKey, manufacturerKey, warranty, manualLink,
            price, discount
        } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Товар для оновлення не знайдено" });
        }

        // --- 1. ПІДГОТОВКА ДАНИХ (для $set) ---
        const updateData = {};
        
        // 1.1 Основні поля
        if (name_ua) updateData['name.ua'] = name_ua;
        if (name_en) updateData['name.en'] = name_en;
        if (category) updateData.category = category;
        if (typeKey) updateData.typeKey = typeKey;
        
        // 1.2 Фінансові поля
        updateData.price = price ? Number(price) : null;
        updateData.discount = discount ? Number(discount) : null;

        // 1.3 Специфікації
        const specifications = product.specifications || {};
        specifications.width = width ? parseFloat(width) : null;
        specifications.height = height ? parseFloat(height) : null;
        specifications.depth = depth ? parseFloat(depth) : null;
        specifications.weight = weight ? parseFloat(weight) : null;
        specifications.bedSize = bedSize || null;
        specifications.materialKey = materialKey || null;
        specifications.manufacturerKey = manufacturerKey || null;
        specifications.warranty = warranty ? Number(warranty) : null;
        specifications.manualLink = manualLink || null;
        
        updateData.specifications = specifications;
        
        // --- 2. ОБРОБКА ФАЙЛІВ (Оновлюємо, якщо надано нові) ---
        
        const uploadedImages = req.files?.images; // 🔥 Multer очікує images
        const uploadedModel = req.files?.modelFile?.[0];
        const newCategory = category || product.category; 

        // 2.1 Оновлення ЗОБРАЖЕНЬ (Галерея)
        if (uploadedImages && uploadedImages.length > 0) {
            // 🔥 Видаляємо всі старі файли з галереї
            if (product.images && product.images.length > 0) {
                product.images.forEach(deleteFile);
            }
            // Зберігаємо шляхи до нових файлів
            updateData.images = uploadedImages.map(file => `/uploads/products/${newCategory}/${file.filename}`);
        }
        
        // 2.2 Оновлення 3D МОДЕЛІ
        if (uploadedModel) {
            if (product.modelUrl) {
                deleteFile(product.modelUrl);
            }
            updateData.modelUrl = `/uploads/products/${newCategory}/${uploadedModel.filename}`;
        }

        // --- 3. ЗБЕРЕЖЕННЯ ---
        const updatedProduct = await Product.findByIdAndUpdate(productId, 
            { $set: updateData }, 
            { new: true, runValidators: true } 
        );

        res.json(updatedProduct);

    } catch (err) {
        console.error("Помилка при оновленні продукту:", err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: "Помилка валідації даних" });
        }
        res.status(500).json({ message: "Помилка сервера при оновленні продукту" });
    }
};


// =======================
// 5. Видалити продукт
// =======================
export const deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Продукт не знайдено" });

        // Утилізація старих файлів
        if (deleted.images && deleted.images.length > 0) {
            deleted.images.forEach(deleteFile); // 🔥 Видаляємо всі фото з галереї
        }
        if (deleted.modelUrl) deleteFile(deleted.modelUrl);
        
        res.json({ message: "Продукт успішно видалено" });
    } catch (err) {
        console.error("Помилка при видаленні продукту:", err);
        res.status(500).json({ message: "Помилка при видаленні продукту" });
    }
};