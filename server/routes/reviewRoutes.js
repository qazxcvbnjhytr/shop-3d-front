// server/routes/reviewRoutes.js
import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

async function recomputeAndUpdateProductRating(productId) {
  const productObjId = new mongoose.Types.ObjectId(productId);

  const stats = await Review.aggregate([
    { $match: { product: productObjId, isApproved: true } },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const meta = stats?.[0] || { avgRating: 0, count: 0 };
  const avgRating = Math.round(Number(meta.avgRating || 0) * 10) / 10;
  const count = Number(meta.count || 0);

  await Product.findByIdAndUpdate(productId, {
    $set: { ratingAvg: avgRating, ratingCount: count },
  });

  return { avgRating, count };
}

/**
 * GET /api/reviews/product/:productId?page=1&limit=10
 */
router.get("/product/:productId", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    const { productId } = req.params;
    if (!isValidId(productId)) return res.status(400).json({ message: "Invalid productId" });

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
    const skip = (page - 1) * limit;

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
        { $group: { _id: "$product", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]),
    ]);

    const meta = stats?.[0] || { avgRating: 0, count: 0 };
    const avgRating = Math.round(Number(meta.avgRating || 0) * 10) / 10;

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
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
 */
router.post("/", protect, async (req, res) => {
  try {
    const { productId, rating, title, text } = req.body;

    if (!productId || rating == null) {
      return res.status(400).json({ message: "productId and rating are required" });
    }
    if (!isValidId(productId)) return res.status(400).json({ message: "Invalid productId" });

    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      return res.status(400).json({ message: "rating must be 1..5" });
    }

    const exists = await Product.findById(productId).select("_id");
    if (!exists) return res.status(404).json({ message: "Product not found" });

    const doc = await Review.findOneAndUpdate(
      { product: productId, user: req.user._id },
      { rating: r, title: title || "", text: text || "", isApproved: true },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const { avgRating, count } = await recomputeAndUpdateProductRating(productId);
    res.json({ review: doc, avgRating, count });
  } catch (e) {
    console.error("POST /api/reviews error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
