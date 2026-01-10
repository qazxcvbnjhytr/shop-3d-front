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
import User from "./models/userModel.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import subCategoryRoutes from "./routes/subCategoryRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import translationRoutes from "./routes/translations.js";
import locationRoutes from "./routes/locationRoutes.js";
import specTemplateRoutes from "./routes/specTemplateRoutes.js";
import specConfigRoutes from "./routes/specConfigRoutes.js";

// Middleware
import { protect } from "./middleware/authMiddleware.js";
import { protectAdmin } from "./admin/middleware/protectAdmin.js";
import adminRouter from "./admin/routes/admin.index.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ✅ One “support admin”, to whom everyone writes (optional)
const SUPPORT_ADMIN_ID = String(process.env.SUPPORT_ADMIN_ID || "").trim();

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

// static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

// ==========================
// Chat helpers
// ==========================
async function resolveSupportAdminId() {
  if (SUPPORT_ADMIN_ID) return SUPPORT_ADMIN_ID;

  // fallback: find first admin
  const admin = await User.findOne({
    $or: [{ role: "admin" }, { isAdmin: true }, { is_admin: true }],
  }).select("_id");

  return admin?._id ? String(admin._id) : "";
}

// ✅ Public endpoint for widget (guest/user without token also needs it)
app.get("/api/chat/support-admin", async (req, res) => {
  try {
    const id = await resolveSupportAdminId();
    if (!id) return res.status(404).json({ message: "NO_SUPPORT_ADMIN" });
    res.json({ adminId: id });
  } catch (e) {
    res.status(500).json({ message: "SUPPORT_ADMIN_RESOLVE_ERROR" });
  }
});

// ==========================
// Socket.IO (Real-time Chat)
// ==========================
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
  transports: ["polling", "websocket"],
});

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("join_chat", (roomId) => {
    if (!roomId) return;
    socket.join(String(roomId));
  });

  socket.on("send_message", async (data) => {
    try {
      const sender = String(data?.sender || "");
      const receiver = String(data?.receiver || "");
      const text = String(data?.text || "").trim();
      const isGuest = Boolean(data?.isGuest);

      if (!sender || !receiver || !text) return;

      const newMessage = await Message.create({
        sender,
        receiver,
        text,
        isGuest,
        isRead: false,
      });

      io.to(receiver).emit("receive_message", newMessage);
      io.to(sender).emit("receive_message", newMessage);

      console.log(`✉️ Chat: ${sender} -> ${receiver}`);
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

  socket.on("disconnect", () => console.log("🔌 Disconnected"));
});

// ==========================
// API Routes
// ==========================
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/likes", protect, likeRoutes);
app.use("/api/translations", translationRoutes);
app.use("/api/locations", locationRoutes);

// ✅ Reviews (IMPORTANT for your 404)
app.use("/api/reviews", reviewRoutes);

// ✅ Specs
app.use("/api/spec-templates", specTemplateRoutes);
app.use("/api/spec-config", specConfigRoutes);

// --- Chat REST API ---
// History between two people (user/guest <-> admin)
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
    res.status(500).json({ message: "Error loading history" });
  }
});

// Admin history (admin id from token)
app.get("/api/admin/chat-history/:partnerId", protect, protectAdmin, async (req, res) => {
  try {
    const adminId = String(req.user._id);
    const partnerId = String(req.params.partnerId);

    const messages = await Message.find({
      $or: [
        { sender: adminId, receiver: partnerId },
        { sender: partnerId, receiver: adminId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (e) {
    res.status(500).json({ message: "Error loading admin history" });
  }
});

// Conversations inbox for support admin
app.get("/api/admin/chat-conversations", protect, protectAdmin, async (req, res) => {
  try {
    const currentAdminId = String(req.user._id);
    const supportId = await resolveSupportAdminId();
    const inboxId = supportId || currentAdminId;

    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: inboxId }, { receiver: inboxId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$sender", inboxId] }, "$receiver", "$sender"] },
          lastMessage: { $first: "$text" },
          lastDate: { $first: "$createdAt" },
          isGuest: { $first: "$isGuest" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ["$sender", inboxId] }, { $eq: ["$isRead", false] }] },
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
              else: { $concat: ["Гість (", { $substr: ["$_id", 6, 4] }, ")"] },
            },
          },
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

// Admin router
app.use("/api/admin", adminRouter);

// ==========================
// Health check (optional but useful)
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ==========================
// Start Server & Connect DB
// ==========================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
