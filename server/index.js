// server/index.js

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import http from "http";
import { Server } from "socket.io";

import Message from "./models/Message.js";

// ==========================
// Routes
// ==========================
import authRoutes from "./routes/authRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import subCategoryRoutes from "./routes/subCategoryRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import translationRoutes from "./routes/translations.js";
import locationRoutes from "./routes/locationRoutes.js";

import specTemplateRoutes from "./routes/specTemplateRoutes.js";
import specConfigRoutes from "./routes/specConfigRoutes.js";

import { protect } from "./middleware/authMiddleware.js";
import { setUserOnline } from "./middleware/onlineMiddleware.js";

// ✅ Адмін middleware (wrapper)
import { protectAdmin } from "./admin/middleware/protectAdmin.js";

// ✅ Адмін router (без async import)
import adminRouter from "./admin/routes/admin.index.js";

// ==========================
// Telegram bot (DISABLED by default)
// ==========================
let initTelegramBot = null;
let sendToTelegram = null;

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const ADMIN_ID = process.env.ADMIN_ID || "69486848fd50e39e9a7537b0";

// --------------------------
// CORS
// --------------------------
const corsOptions = {
  origin: CLIENT_URL,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// --------------------------
// Static uploads
// --------------------------
// ВАЖЛИВО: все, що кладеш у server/public/uploads/* буде доступно як /uploads/*
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

// --------------------------
// Health
// --------------------------
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ==========================
// Socket.IO (Chat)
// ==========================
const io = new Server(server, { cors: corsOptions });

const TELEGRAM_ENABLED =
  String(process.env.TELEGRAM_BOT_ENABLED || "false").toLowerCase() === "true";

let tgBot = null;

(async () => {
  if (!TELEGRAM_ENABLED) {
    console.log("ℹ️ Telegram bot: disabled (TELEGRAM_BOT_ENABLED=false)");
    return;
  }

  try {
    const mod = await import("./bot/telegramBot.js");
    initTelegramBot = mod.initTelegramBot;
    sendToTelegram = mod.sendToTelegram;

    const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
    const apiBase = `http://localhost:${PORT}`;

    const res = initTelegramBot({
      io,
      adminId: ADMIN_ID,
      token: TELEGRAM_TOKEN,
      enabled: TELEGRAM_ENABLED,
      apiBase,
    });

    tgBot = res?.bot || null;
    console.log("✅ Telegram bot started");
  } catch (e) {
    console.error("❌ Telegram bot failed to start:", e?.message || e);
  }
})();

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("join_chat", (userId) => {
    if (!userId) return;
    socket.join(String(userId));
  });

  socket.on("send_message", async (data) => {
    try {
      const sender = String(data?.sender || "");
      const receiver = String(data?.receiver || "");
      const text = String(data?.text || "").trim();

      if (!sender || !receiver || !text) return;

      const newMessage = await Message.create({
        sender,
        receiver,
        text,
        isGuest: Boolean(data?.isGuest),
        isRead: false,
      });

      io.to(receiver).emit("receive_message", newMessage);
      io.to(sender).emit("receive_message", newMessage);

      if (TELEGRAM_ENABLED && tgBot && typeof sendToTelegram === "function") {
        await sendToTelegram({ bot: tgBot, receiverId: receiver, text });
      }
    } catch (err) {
      console.error("Socket send_message error:", err);
    }
  });

  socket.on("mark_read", async ({ myId, partnerId }) => {
    try {
      if (!myId || !partnerId) return;

      await Message.updateMany(
        { sender: String(partnerId), receiver: String(myId), isRead: false },
        { $set: { isRead: true } }
      );

      io.to(String(partnerId)).emit("messages_read_update", { by: String(myId) });
    } catch (err) {
      console.error("Socket mark_read error:", err);
    }
  });

  socket.on("typing", ({ from, to, isTyping }) => {
    try {
      if (!from || !to) return;
      io.to(String(to)).emit("typing_update", {
        from: String(from),
        to: String(to),
        isTyping: Boolean(isTyping),
      });
    } catch (e) {
      console.error("Socket typing error:", e);
    }
  });

  socket.on("disconnect", () => console.log("🔌 Disconnected"));
});

// ==========================
// API Routes (Main)
// ==========================
app.use("/api/auth", authRoutes);

app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/products", productRoutes);

app.use("/api/spec-templates", specTemplateRoutes);
app.use("/api/spec-config", specConfigRoutes);

app.use("/api/likes", protect, setUserOnline, likeRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);

app.use("/api/translations", translationRoutes);
app.use("/api/locations", locationRoutes);

// ==========================
// Chat REST endpoints
// ==========================

// Messages between two users (front chat)
app.get("/api/messages/:u1/:u2", async (req, res) => {
  try {
    const { u1, u2 } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: String(u1), receiver: String(u2) },
        { sender: String(u2), receiver: String(u1) },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Error loading messages" });
  }
});

// Admin conversations list (admin panel)
app.get("/api/admin/chat-conversations", protect, protectAdmin, async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: ADMIN_ID }, { receiver: ADMIN_ID }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$sender", ADMIN_ID] }, "$receiver", "$sender"] },
          lastMessage: { $first: "$text" },
          lastDate: { $first: "$createdAt" },
          isGuest: { $first: "$isGuest" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$sender", ADMIN_ID] }, { $eq: ["$isRead", false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { partnerId: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$partnerId"] } } }],
          as: "userDetails",
        },
      },
      {
        $project: {
          userId: "$_id",
          userName: {
            $cond: {
              if: { $gt: [{ $size: "$userDetails" }, 0] },
              then: { $arrayElemAt: ["$userDetails.name", 0] },
              else: {
                $cond: {
                  if: { $regexMatch: { input: "$_id", regex: /^tg:/ } },
                  then: { $concat: ["Telegram (", { $substr: ["$_id", 3, 6] }, ")"] },
                  else: { $concat: ["Гість (", { $substr: ["$_id", 6, 4] }, ")"] },
                },
              },
            },
          },
          userEmail: { $arrayElemAt: ["$userDetails.email", 0] },
          lastMessage: 1,
          lastDate: 1,
          isGuest: 1,
          unreadCount: 1,
        },
      },
      { $sort: { lastDate: -1 } },
    ]);

    res.json(conversations);
  } catch (err) {
    console.error("Aggregation Error:", err);
    res.status(500).json({ message: "Error fetching conversations" });
  }
});

// ==========================
// Admin router (module)
// ==========================
app.use("/api/admin", adminRouter);
console.log("✅ Admin router mounted: /api/admin");

// ==========================
// Global error handler (optional but useful)
// ==========================
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ message: "Server error" });
});

// ==========================
// Mongo + Start
// ==========================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("🔎 Mounted routes:");
  console.log("   ... /api/products/*");
  console.log("   ... /api/categories/*");
  console.log("   ... /api/translations/*");
  console.log("   ... /api/admin/*");
});
