import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const clampQty = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.floor(n));
};

export const getCart = async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name image price discount category", // під UI
  });

  res.json(cart || { user: userId, items: [] });
};

export const addToCart = async (req, res) => {
  const userId = req.user._id;
  const { productId, qty = 1 } = req.body;

  const product = await Product.findById(productId).select("_id");
  if (!product) return res.status(404).json({ message: "Product not found" });

  const q = clampQty(qty);

  const cart = (await Cart.findOne({ user: userId })) || (await Cart.create({ user: userId, items: [] }));

  const idx = cart.items.findIndex((x) => String(x.product) === String(productId));
  if (idx >= 0) cart.items[idx].qty = clampQty(cart.items[idx].qty + q);
  else cart.items.push({ product: productId, qty: q });

  await cart.save();
  const populated = await cart.populate({ path: "items.product", select: "name image price discount category" });

  res.json(populated);
};

export const setQty = async (req, res) => {
  const userId = req.user._id;
  const { productId, qty } = req.body;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) return res.json({ user: userId, items: [] });

  const idx = cart.items.findIndex((x) => String(x.product) === String(productId));
  if (idx < 0) return res.status(404).json({ message: "Item not in cart" });

  cart.items[idx].qty = clampQty(qty);
  await cart.save();

  const populated = await cart.populate({ path: "items.product", select: "name image price discount category" });
  res.json(populated);
};

export const removeItem = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) return res.json({ user: userId, items: [] });

  cart.items = cart.items.filter((x) => String(x.product) !== String(productId));
  await cart.save();

  const populated = await cart.populate({ path: "items.product", select: "name image price discount category" });
  res.json(populated);
};

export const clearCart = async (req, res) => {
  const userId = req.user._id;
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return res.json({ user: userId, items: [] });

  cart.items = [];
  await cart.save();

  res.json({ user: userId, items: [] });
};
