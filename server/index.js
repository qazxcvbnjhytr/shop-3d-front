// server/index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import { fileURLToPath } from "url";
import fs from "fs";

// ====== ROUTES (підстав свої реальні файли) ======
import authRoutes from "./routes/authRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import subCategoryRoutes from "./routes/subCategoryRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import translationRoutes from "./routes/translations.js"; // ✅ твій translations роут
import locationRoutes from "./routes/locationRoutes.js";
import specConfigRoutes from "./routes/specConfigRoutes.js";

// (опційно) missing translations / адмін
// import i18nMissingRoutes from "./routes/i18nMissingRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================================================
// ✅ DOTENV для монорепи:
// 1) server/.env
// 2) ../.env (корінь проекту)
// ==================================================
const envServer = path.resolve(__dirname, ".env");
const envRoot = path.resolve(__dirname, "../.env");

if (fs.existsSync(envServer)) {
  dotenv.config({ path: envServer });
  console.log("✅ Loaded env from:", envServer);
} else if (fs.existsSync(envRoot)) {
  dotenv.config({ path: envRoot });
  console.log("✅ Loaded env from:", envRoot);
} else {
  dotenv.config();
  console.log("⚠️ Loaded env from default lookup (no explicit .env found)");
}

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const MONGO_URI = process.env.MONGO_URI;

// ==================================================
// APP + SERVER + SOCKET
// ==================================================
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

// Якщо тобі треба доступ до io в контролерах:
app.set("io", io);

// ==================================================
// SECURITY / MIDDLEWARE
// ==================================================
app.use(
  helmet({
    crossOriginResourcePolicy: false, // щоб картинки/uploads не блокувались
  })
);

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==================================================
// STATIC (uploads)
// Якщо ти зберігаєш фото/файли у server/uploads
// ==================================================
const uploadsPath = path.resolve(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

app.use("/uploads", express.static(uploadsPath));

// ==================================================
// HEALTHCHECK (для швидкої перевірки)
// ==================================================
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection?.name || null,
    time: new Date().toISOString(),
  });
});

// ==================================================
// ROUTES
// ==================================================
app.use("/api/auth", authRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/translations", translationRoutes); // ✅ ОСЬ ТУТ ВАЖЛИВО
app.use("/api/locations", locationRoutes);
app.use("/api/spec-config", specConfigRoutes);

// app.use("/api/i18n-missing", i18nMissingRoutes);

// ==================================================
// SOCKET.IO (мінімальний приклад)
// ==================================================
io.on("connection", (socket) => {
  // console.log("🟢 socket connected:", socket.id);

  socket.on("disconnect", () => {
    // console.log("🔴 socket disconnected:", socket.id);
  });
});

// ==================================================
// GLOBAL ERROR HANDLER
// ==================================================
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(err?.status || 500).json({
    message: err?.message || "Server error",
  });
});

// ==================================================
// DB CONNECT + START
// ==================================================
async function start() {
  try {
    if (!MONGO_URI) {
      console.error("❌ MONGO_URI is missing. Check your .env path/loading.");
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log("✅ Mongo connected:", mongoose.connection.name);
    console.log("✅ MONGO_URI:", MONGO_URI);

    server.listen(PORT, () => {
      console.log(`🚀 API running on http://localhost:${PORT}`);
      console.log(`✅ Client URL allowed: ${CLIENT_URL}`);
      console.log(`✅ Health: http://localhost:${PORT}/api/health`);
      console.log(`✅ Translations test: http://localhost:${PORT}/api/translations?lang=ua`);
    });
  } catch (e) {
    console.error("❌ Failed to start server:", e);
    process.exit(1);
  }
}

start();
