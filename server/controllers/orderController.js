// server/controllers/orderController.js
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/userModel.js";
import Product from "../models/Product.js";
import Location from "../models/Location.js";

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

const normalizePhone = (s) => String(s || "").replace(/[^\d+]/g, "").trim();

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const pickStr = (v) => String(v ?? "").trim();

const assertUser = (req) => {
  const id = req.user?._id || req.user?.id;
  if (!id) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
  return id;
};

/**
 * USER: POST /api/orders
 * Create my order and link it to the logged-in user.
 */
export const createMyOrder = async (req, res) => {
  try {
    const userId = assertUser(req);

    const payload = req.body || {};

    // --- validate customer ---
    const customer = payload.customer || {};
    const fullName = pickStr(customer.fullName);
    const phone = normalizePhone(customer.phone);
    const email = pickStr(customer.email);

    // In your UI you mentioned server says: "Customer fullName, phone, city are required"
    // We'll keep similar validation here.
    if (!fullName) return res.status(400).json({ message: "Customer fullName is required" });
    if (!phone || phone.length < 10) return res.status(400).json({ message: "Customer phone is required" });

    // --- validate delivery ---
    const delivery = payload.delivery || {};
    const city = pickStr(delivery.city);
    const method = pickStr(delivery.method);

    if (!city) return res.status(400).json({ message: "Delivery city is required" });
    if (!["pickup", "courier", "nova_poshta"].includes(method)) {
      return res.status(400).json({ message: "Delivery method is invalid" });
    }

    let pickupLocationId = null;
    let address = "";
    let npOffice = "";

    if (method === "pickup") {
      const rawId = delivery.pickupLocationId ?? delivery.locationId ?? null;
      if (!rawId || !isObjectId(rawId)) {
        return res.status(400).json({ message: "pickupLocationId is required for pickup" });
      }

      // optional: verify location exists and is active
      const loc = await Location.findOne({ _id: rawId, isActive: true }).select("_id type city").lean();
      if (!loc) return res.status(400).json({ message: "Pickup location not found" });

      pickupLocationId = loc._id;
      address = "";
      npOffice = "";
    }

    if (method === "courier") {
      address = pickStr(delivery.address);
      if (!address) return res.status(400).json({ message: "address is required for courier" });
      pickupLocationId = null;
      npOffice = "";
    }

    if (method === "nova_poshta") {
      npOffice = pickStr(delivery.npOffice);
      if (!npOffice) return res.status(400).json({ message: "npOffice is required for nova_poshta" });
      pickupLocationId = null;
      address = "";
    }

    // --- validate items ---
    const itemsRaw = Array.isArray(payload.items) ? payload.items : [];
    if (itemsRaw.length === 0) return res.status(400).json({ message: "Order items are required" });

    // Collect ids
    const ids = itemsRaw
      .map((it) => it.productId)
      .filter(Boolean)
      .map(String)
      .filter(isObjectId);

    if (ids.length !== itemsRaw.length) {
      return res.status(400).json({ message: "Each item must contain valid productId" });
    }

    // Load products to create snapshot (name, price, sku, image)
    const products = await Product.find({ _id: { $in: ids } })
      .select("_id name price finalPrice sku images image discountPct")
      .lean();

    const byId = new Map(products.map((p) => [String(p._id), p]));

    const items = itemsRaw.map((it) => {
      const p = byId.get(String(it.productId));
      if (!p) {
        // product removed or wrong id
        throw Object.assign(new Error("Product not found in items"), { statusCode: 400 });
      }

      const qty = Math.max(1, Math.floor(toNumber(it.qty, 1)));

      // price snapshot:
      // - if client sends price, we can accept it but safer to use product finalPrice/price
      // - if you have discount logic server-side, use your finalPrice field; else fallback to price
      const priceSnapshot =
        Number.isFinite(toNumber(p.finalPrice)) && toNumber(p.finalPrice) > 0
          ? toNumber(p.finalPrice)
          : toNumber(p.price);

      const nameSnapshot = pickStr(it.name) || pickStr(p?.name?.ua) || pickStr(p?.name?.en) || "Product";
      const skuSnapshot = pickStr(it.sku) || pickStr(p.sku) || "";
      const imageSnapshot =
        pickStr(it.image) ||
        pickStr(p.image) ||
        (Array.isArray(p.images) && p.images[0] ? String(p.images[0]) : "");

      return {
        productId: p._id,
        name: nameSnapshot,
        qty,
        price: priceSnapshot,
        sku: skuSnapshot,
        image: imageSnapshot,
      };
    });

    // --- totals ---
    // Prefer server computed totals for integrity
    const subtotal = items.reduce((sum, it) => sum + it.qty * it.price, 0);

    // If you have savings on server, calculate; else accept from client but clamp
    const totalsRaw = payload.totals || {};
    const totalSavings = Math.max(0, toNumber(totalsRaw.totalSavings, 0));

    // cartTotal: allow client to send, but keep consistent with subtotal - savings if savings exists
    const cartTotalRaw = toNumber(totalsRaw.cartTotal, subtotal - totalSavings);
    const cartTotal = Math.max(0, cartTotalRaw);

    const comment = pickStr(payload.comment);

    const order = await Order.create({
      user: userId,
      customer: { fullName, phone, email },
      delivery: {
        city,
        method,
        pickupLocationId,
        address,
        npOffice,
      },
      comment,
      items,
      totals: {
        subtotal,
        totalSavings,
        cartTotal,
      },
      status: "new",
      scheduledAt: null,
      adminNote: "",
      cancelledAt: null,
    });

    // Link order to user (Variant B)
    // Ensure user schema has `orders: [{ type: ObjectId, ref: 'Order' }]`
    await User.updateOne({ _id: userId }, { $addToSet: { orders: order._id } });

    res.status(201).json(order);
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("❌ createMyOrder error:", error);
    res.status(status).json({ message: error.message || "Server error creating order" });
  }
};

/**
 * USER: GET /api/orders/my
 */
export const listMyOrders = async (req, res) => {
  try {
    const userId = assertUser(req);
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ user: userId }),
    ]);

    res.json({
      items,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("❌ listMyOrders error:", error);
    res.status(500).json({ message: "Server error listing orders" });
  }
};

/**
 * USER: GET /api/orders/my/:id
 */
export const getMyOrder = async (req, res) => {
  try {
    const userId = assertUser(req);
    const { id } = req.params;

    if (!isObjectId(id)) return res.status(400).json({ message: "Invalid order id" });

    const order = await Order.findOne({ _id: id, user: userId })
      .populate("delivery.pickupLocationId", "type city nameKey addressKey phone workingHours coordinates")
      .lean();

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (error) {
    console.error("❌ getMyOrder error:", error);
    res.status(500).json({ message: "Server error getting order" });
  }
};

/**
 * ADMIN: GET /api/orders
 * Query: q, status, page, limit
 * q searches customer.fullName/phone/email and also user email/name.
 */
export const adminListOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const status = pickStr(req.query.status);
    const q = pickStr(req.query.q);

    const filter = {};
    if (status && ["new", "confirmed", "processing", "shipped", "completed", "cancelled"].includes(status)) {
      filter.status = status;
    }

    // Base query
    let query = Order.find(filter);

    // q with user join: simplest approach: if q exists, populate user and filter in-memory is heavy.
    // Better: use $or on customer fields; and if q looks like email, also match user by query separate.
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { "customer.fullName": re },
        { "customer.phone": re },
        { "customer.email": re },
        { "delivery.city": re },
      ];

      // additionally match by user (name/email) by looking up user ids
      const users = await User.find({ $or: [{ email: re }, { name: re }] }).select("_id").lean();
      const userIds = users.map((u) => u._id);

      if (userIds.length) {
        filter.$or.push({ user: { $in: userIds } });
      }

      query = Order.find(filter);
    }

    const [items, total] = await Promise.all([
      query
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email")
        .lean(),
      Order.countDocuments(filter),
    ]);

    // Return minimal list fields (your AdminOrders expects: _id, customer, status, createdAt, totals/cartTotal)
    res.json({
      items,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("❌ adminListOrders error:", error);
    res.status(500).json({ message: "Server error listing orders" });
  }
};

/**
 * ADMIN: GET /api/orders/:id
 */
export const adminGetOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(400).json({ message: "Invalid order id" });

    const order = await Order.findById(id)
      .populate("user", "name email")
      .populate("delivery.pickupLocationId", "type city nameKey addressKey phone workingHours coordinates isActive")
      .lean();

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (error) {
    console.error("❌ adminGetOrder error:", error);
    res.status(500).json({ message: "Server error getting order" });
  }
};

/**
 * ADMIN: PATCH /api/orders/:id
 * Body: { status?, scheduledAt?, adminNote? }
 */
export const adminPatchOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(400).json({ message: "Invalid order id" });

    const body = req.body || {};

    const patch = {};

    if (body.status) {
      const st = pickStr(body.status);
      const allowed = ["new", "confirmed", "processing", "shipped", "completed", "cancelled"];
      if (!allowed.includes(st)) return res.status(400).json({ message: "Invalid status" });
      patch.status = st;
      if (st !== "cancelled") patch.cancelledAt = null;
      if (st === "cancelled" && !patch.cancelledAt) patch.cancelledAt = new Date();
    }

    if (body.scheduledAt !== undefined) {
      // can be null
      if (body.scheduledAt === null || body.scheduledAt === "") {
        patch.scheduledAt = null;
      } else {
        const d = new Date(body.scheduledAt);
        if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "Invalid scheduledAt" });
        patch.scheduledAt = d;
      }
    }

    if (body.adminNote !== undefined) {
      patch.adminNote = pickStr(body.adminNote);
    }

    // Also support your previous AdminOrders payload shape:
    // { admin: { note, scheduledAt }, status }
    if (body.admin && typeof body.admin === "object") {
      if (body.admin.note !== undefined) patch.adminNote = pickStr(body.admin.note);
      if (body.admin.scheduledAt !== undefined) {
        if (body.admin.scheduledAt === null || body.admin.scheduledAt === "") {
          patch.scheduledAt = null;
        } else {
          const d = new Date(body.admin.scheduledAt);
          if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "Invalid admin.scheduledAt" });
          patch.scheduledAt = d;
        }
      }
    }

    const updated = await Order.findByIdAndUpdate(id, { $set: patch }, { new: true })
      .populate("user", "name email")
      .populate("delivery.pickupLocationId", "type city nameKey addressKey phone workingHours coordinates")
      .lean();

    if (!updated) return res.status(404).json({ message: "Order not found" });

    res.json(updated);
  } catch (error) {
    console.error("❌ adminPatchOrder error:", error);
    res.status(500).json({ message: "Server error updating order" });
  }
};

/**
 * ADMIN: POST /api/orders/:id/cancel
 * Body: { note? }  (optional)
 */
export const adminCancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(400).json({ message: "Invalid order id" });

    const note = pickStr(req.body?.note || req.body?.reason || "");

    const updated = await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          adminNote: note ? note : undefined,
        },
      },
      { new: true }
    )
      .populate("user", "name email")
      .lean();

    if (!updated) return res.status(404).json({ message: "Order not found" });

    // if adminNote is undefined, mongoose won't remove old value. That’s ok.
    // If you want to clear adminNote when empty, handle it via PATCH.

    res.json(updated);
  } catch (error) {
    console.error("❌ adminCancelOrder error:", error);
    res.status(500).json({ message: "Server error cancelling order" });
  }
};

/**
 * ADMIN: DELETE /api/orders/:id
 * Also removes the orderId from user.orders array.
 */
export const adminDeleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(400).json({ message: "Invalid order id" });

    const order = await Order.findById(id).select("_id user").lean();
    if (!order) return res.status(404).json({ message: "Order not found" });

    await Order.deleteOne({ _id: id });
    await User.updateOne({ _id: order.user }, { $pull: { orders: order._id } });

    res.json({ ok: true });
  } catch (error) {
    console.error("❌ adminDeleteOrder error:", error);
    res.status(500).json({ message: "Server error deleting order" });
  }
};
