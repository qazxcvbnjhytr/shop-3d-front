import SubCategory from "../models/SubCategory.js";

const sanitizeKey = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_");

export const getSubCategoriesByParent = async (req, res) => {
  try {
    const parent = sanitizeKey(req.params.category);
    const list = await SubCategory.find({ parent }).sort({ order: 1, createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("Failed to get subcategories:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createSubCategory = async (req, res) => {
  try {
    const parent = sanitizeKey(req.body.parent);
    const sub = sanitizeKey(req.body.sub);
    const name_ua = req.body.name_ua?.trim();
    const name_en = req.body.name_en?.trim();
    const order = Number(req.body.order || 0);

    if (!parent || !sub || !name_ua || !name_en) {
      return res.status(400).json({ message: "parent, sub, name_ua, name_en are required" });
    }

    const image = req.file
      ? `/UPLOAD/categories/${parent}/subs/${sub}/${req.file.filename}`
      : (req.body.imageUrl || "").trim();

    const doc = await SubCategory.create({
      parent,
      sub,
      names: { ua: name_ua, en: name_en },
      image,
      order,
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error("Failed to create subcategory:", err);
    if (err?.code === 11000) return res.status(409).json({ message: "SubCategory already exists for this parent" });
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const name_ua = req.body.name_ua?.trim();
    const name_en = req.body.name_en?.trim();
    const order = req.body.order != null ? Number(req.body.order) : undefined;

    const update = {};
    if (name_ua && name_en) update.names = { ua: name_ua, en: name_en };
    if (Number.isFinite(order)) update.order = order;

    if (req.file) {
      const parent = sanitizeKey(req.body.parent);
      const sub = sanitizeKey(req.body.sub);
      if (!parent || !sub) return res.status(400).json({ message: "parent and sub are required when uploading image" });
      update.image = `/UPLOAD/categories/${parent}/subs/${sub}/${req.file.filename}`;
    } else if ((req.body.imageUrl || "").trim()) {
      update.image = req.body.imageUrl.trim();
    }

    const updated = await SubCategory.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.status(404).json({ message: "SubCategory not found" });

    res.json(updated);
  } catch (err) {
    console.error("Failed to update subcategory:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await SubCategory.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "SubCategory not found" });

    res.json({ message: "SubCategory deleted" });
  } catch (err) {
    console.error("Failed to delete subcategory:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
