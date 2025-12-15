// server/index.js (ОНОВЛЕНИЙ ВАРІАНТ)

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path"; 

// 🔥 Роути для функціоналу
import authRoutes from "./routes/authRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";

// 🔥🔥🔥 НОВИЙ/ВИПРАВЛЕНИЙ ІМПОРТ: Роути для перекладів
import translationRoutes from "./routes/translations.js";

// Middleware
import { protect } from "./middleware/authMiddleware.js";
import { setUserOnline } from "./middleware/onlineMiddleware.js";

// Модель перекладів
// import Translation from "./models/Translation.js"; // Не потрібен тут

dotenv.config();

const app = express();

// =======================
// Middleware (CORS, JSON, Cookies)
// =======================
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// =======================
// Роздача статики (картинок)
// =======================
// path.join(process.cwd(), 'public/uploads') - це надійний сеньйорський спосіб!
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// =======================
// 🔥 РОУТИ API (middleware setUserOnline для всіх запитів)
// =======================

// 1. АВТОРИЗАЦІЯ
app.use("/api/auth", authRoutes);

// 2. КАТЕГОРІЇ (Доступні всім)
app.use("/api/categories", categoryRoutes);

// 3. ПРОДУКТИ (Доступні всім, захист POST/PUT/DELETE у productRoutes.js)
app.use("/api/products", setUserOnline, productRoutes);

// 4. ЛАЙКИ (Захищені, бо потрібен user ID)
app.use("/api/likes", protect, setUserOnline, likeRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);

// 5. АДМІН (Захищені всередині adminRoutes.js)
app.use("/api/admin", adminRoutes); 

// 6. 🔥🔥🔥 НОВИЙ API ДЛЯ ПЕРЕКЛАДІВ 🔥🔥🔥
// Ми підключаємо роутер, який ти створив у translationRoutes.js
// Цей роутер обробляє запити: GET /api/translations/ua та /api/translations/en
app.use("/api/translations", translationRoutes);


// =======================
// Підключення до MongoDB
// =======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// =======================
// Запуск сервера
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));