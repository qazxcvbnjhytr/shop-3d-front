// server/admin/controllers/orders.controller.js
import mongoose from "mongoose";
import Order from "../../models/Order.js";

const oid = (v) => {
  try {
    return new mongoose.Types.ObjectId(String(v));
  } catch {
    return null;
  }
};

const toNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const normOrder = (o) => {
  const totals = o?.totals || {};
  const subtotal = toNum(totals.subtotal, 0);
  const totalSavings = toNum(totals.totalSavings, 0);
  const cartTotal = toNum(totals.cartTotal, subtotal - totalSavings);

  const items = Array.isArray(o?.items) ? o.items : [];
  const safeItems = items.map((it) => {
    const qty = toNum(it?.qty, 1);
    const price = toNum(it?.price, 0);
    const lineTotal = toNum(it?.lineTotal, qty * price);
    return { ...it, qty, price, lineTotal };
  });

  // для сумісності з твоєю адмін-сторінкою
  const delivery = o?.delivery || {};
  const normalizedDelivery = {
    ...delivery,
    addressLine: delivery.address || "",                 // legacy field
    locationId: delivery.pickupLocationId || null,       // legacy field
  };

  return {
    _id: o._id,
    status: o.status,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,

    user: o.user
      ? { _id: o.user._id, name: o.user.name, email: o.user.email, role: o.user.role, status: o.user.status }
      : null,

    customer: o.customer || {},
    delivery: normalizedDelivery,
    comment: o.comment || "",
    items: safeItems,

    totals: { subtotal, totalSavings, cartTotal, currency: totals.currency || "UAH" },

    // legacy / сумісність з UI
    pricing: { subtotal, savings: totalSavings, total: cartTotal },

    admin: o.admin || { note: "", scheduledAt: null },

    cancelledAt: o.cancelledAt || null,
    cancelReason: o.cancelReason || "",
  };
};

// GET /api/admin/orders?q=&status=&page=&limit=
export const adminListOrders = async (req, res) => {
  const q = String(req.query.q || "").trim();
  const status = String(req.query.status || "").trim();
  const page = Math.max(1, toNum(req.query.page, 1));
  const limit = Math.min(100, Math.max(5, toNum(req.query.limit, 20)));
  const skip = (page - 1) * limit;

  const filter = {};
  if (status) filter.status = status;

  if (q) {
    filter.$or = [
      { "customer.fullName": { $regex: q, $options: "i" } },
      { "customer.phone": { $regex: q, $options: "i" } },
      { "customer.email": { $regex: q, $options: "i" } },
    ];
  }

  const [itemsRaw, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email role status")
      .lean(),
    Order.countDocuments(filter),
  ]);

  const pages = Math.max(1, Math.ceil(total / limit));
  res.json({ items: itemsRaw.map(normOrder), total, page, pages, limit });
};

// GET /api/admin/orders/:id
export const adminGetOrder = async (req, res) => {
  const id = oid(req.params.id);
  if (!id) return res.status(400).json({ message: "Bad order id" });

  const o = await Order.findById(id).populate("user", "name email role status").lean();
  if (!o) return res.status(404).json({ message: "Order not found" });

  res.json(normOrder(o));
};

// PATCH /api/admin/orders/:id
// body: { status, admin: { note, scheduledAt } }  (як у твоєму AdminOrders.jsx)
export const adminPatchOrder = async (req, res) => {
  const id = oid(req.params.id);
  if (!id) return res.status(400).json({ message: "Bad order id" });

  const status = req.body?.status ? String(req.body.status) : undefined;
  const note = req.body?.admin?.note != null ? String(req.body.admin.note) : undefined;
  const scheduledAtRaw = req.body?.admin?.scheduledAt;

  const $set = {};
  if (status) $set.status = status;
  if (note !== undefined) $set["admin.note"] = note;

  if (scheduledAtRaw === null) $set["admin.scheduledAt"] = null;
  if (scheduledAtRaw) {
    const d = new Date(scheduledAtRaw);
    if (!Number.isNaN(d.getTime())) $set["admin.scheduledAt"] = d;
  }

  if (!Object.keys($set).length) return res.status(400).json({ message: "Nothing to update" });

  const o = await Order.findByIdAndUpdate(id, { $set }, { new: true }).populate("user", "name email role status").lean();
  if (!o) return res.status(404).json({ message: "Order not found" });

  res.json(normOrder(o));
};

// POST /api/admin/orders/:id/cancel
// body: { reason }
export const adminCancelOrder = async (req, res) => {
  const id = oid(req.params.id);
  if (!id) return res.status(400).json({ message: "Bad order id" });

  const reason = String(req.body?.reason || "").trim();

  const o = await Order.findByIdAndUpdate(
    id,
    {
      $set: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    },
    { new: true }
  )
    .populate("user", "name email role status")
    .lean();

  if (!o) return res.status(404).json({ message: "Order not found" });
  res.json(normOrder(o));
};

// DELETE /api/admin/orders/:id
export const adminDeleteOrder = async (req, res) => {
  const id = oid(req.params.id);
  if (!id) return res.status(400).json({ message: "Bad order id" });

  const del = await Order.deleteOne({ _id: id });
  if (del.deletedCount === 0) return res.status(404).json({ message: "Order not found" });

  res.json({ ok: true });
};
