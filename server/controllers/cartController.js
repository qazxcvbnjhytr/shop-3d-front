import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const clampQty = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
};

const PRODUCT_SELECT = "sku name images price discount category subCategory slug";

const ensureCart = async (userId) => {
  return Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { new: true, upsert: true }
  );
};

const populateCart = async (cart) => {
  return cart.populate({
    path: "items.product",
    select: PRODUCT_SELECT,
  });
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      select: PRODUCT_SELECT,
    });

    res.json(cart || { user: userId, items: [] });
  } catch (err) {
    res.status(500).json({ message: "Cart get error" });
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, qty = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const product = await Product.findById(productId).select("_id");
    if (!product) return res.status(404).json({ message: "Product not found" });

    const q = clampQty(qty);
    const cart = await ensureCart(userId);

    const idx = cart.items.findIndex((x) => String(x.product) === String(productId));
    if (idx >= 0) cart.items[idx].qty = clampQty(cart.items[idx].qty + q);
    else cart.items.push({ product: productId, qty: q });

    await cart.save();
    const populated = await populateCart(cart);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Cart add error" });
  }
};

export const setQty = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, qty } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.json({ user: userId, items: [] });

    const idx = cart.items.findIndex((x) => String(x.product) === String(productId));
    if (idx < 0) return res.status(404).json({ message: "Item not in cart" });

    cart.items[idx].qty = clampQty(qty);
    await cart.save();

    const populated = await populateCart(cart);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Cart qty error" });
  }
};

export const removeItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.json({ user: userId, items: [] });

    cart.items = cart.items.filter((x) => String(x.product) !== String(productId));
    await cart.save();

    const populated = await populateCart(cart);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Cart remove error" });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.json({ user: userId, items: [] });

    cart.items = [];
    await cart.save();

    res.json({ user: userId, items: [] });
  } catch (err) {
    res.status(500).json({ message: "Cart clear error" });
  }
};
