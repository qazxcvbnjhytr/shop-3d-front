// server/routes/reviewRoutes.js
import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET /api/reviews/product/:productId?page=1&limit=10
 * Повертає відгуки по товару + середній рейтинг/кількість
 */
router.get("/product/:productId", async (req, res) => {
  try {
    // ✅ не кешуємо (щоб не було 304 / stale)
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
    const skip = (page - 1) * limit;

    // ✅ ВАЖЛИВО: aggregate не кастить рядок в ObjectId автоматично
    const productObjId = new mongoose.Types.ObjectId(productId);
    const filter = { product: productObjId, isApproved: true };

    const [items, total, stats] = await Promise.all([
      Review.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
      Review.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$product",
            avgRating: { $avg: "$rating" }, // якщо rating Number — ок
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const meta = stats?.[0] || { avgRating: 0, count: 0 };

    const avgRating = Math.round(Number(meta.avgRating || 0) * 10) / 10;

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
      avgRating,
      count: Number(meta.count || total || 0),
    });
  } catch (e) {
    console.error("GET /api/reviews/product/:productId error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/reviews
 * body: { productId, rating, title, text }
 * Створити або оновити відгук (upsert)
 */
router.post("/", protect, async (req, res) => {
  try {
    const { productId, rating, title, text } = req.body;

    if (!productId || rating == null) {
      return res.status(400).json({ message: "productId and rating are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    // перевірка що товар існує
    const exists = await Product.findById(productId).select("_id");
    if (!exists) return res.status(404).json({ message: "Product not found" });

    const doc = await Review.findOneAndUpdate(
      { product: productId, user: req.user._id },
      {
        rating: Number(rating),
        title: title || "",
        text: text || "",
        isApproved: true,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(doc);
  } catch (e) {
    console.error("POST /api/reviews error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE /api/reviews/:id
 * видалити свій відгук
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (String(review.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await review.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/reviews/:id error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
