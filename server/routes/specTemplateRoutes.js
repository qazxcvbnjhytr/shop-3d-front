import express from "express";
import mongoose from "mongoose";

const router = express.Router();

router.get("/:typeKey", async (req, res) => {
  try {
    const { typeKey } = req.params;

    const SpecTemplate = mongoose.connection.collection("spec_templates");
    const SpecField = mongoose.connection.collection("spec_fields");
    const Dictionaries = mongoose.connection.collection("dictionaries");

    const [tpl, defTpl] = await Promise.all([
      SpecTemplate.findOne({ typeKey, isActive: true }),
      SpecTemplate.findOne({ typeKey: "default", isActive: true })
    ]);

    const template = tpl || defTpl;
    if (!template) return res.status(404).json({ message: "Template not found" });

    const fieldKeys = (template.sections || [])
      .flatMap((s) => s.fieldKeys || [])
      .filter(Boolean);

    const fields = await SpecField
      .find({ key: { $in: fieldKeys }, isActive: true })
      .toArray();

    const dictionaries = await Dictionaries.findOne({ _id: "default" });

    return res.json({
      template,
      fields,
      dictionaries: dictionaries || null
    });
  } catch (e) {
    console.error("specTemplateRoutes error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
