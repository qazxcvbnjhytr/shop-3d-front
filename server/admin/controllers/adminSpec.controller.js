import SpecField from "../../models/SpecField.js";
import SpecTemplate from "../../models/SpecTemplate.js";
import Dictionary from "../../models/Dictionary.js"; // если нет — скажи, дам модель

// ---------- Fields ----------
export async function listFields(req, res) {
  const items = await SpecField.find().sort({ sort: 1, key: 1 });
  res.json(items);
}

export async function createField(req, res) {
  const doc = await SpecField.create(req.body);
  res.status(201).json(doc);
}

export async function updateField(req, res) {
  const doc = await SpecField.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ message: "NOT_FOUND" });
  res.json(doc);
}

export async function deleteField(req, res) {
  const doc = await SpecField.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: "NOT_FOUND" });
  res.json({ ok: true });
}

// ---------- Templates ----------
export async function listTemplates(req, res) {
  const items = await SpecTemplate.find().sort({ typeKey: 1 });
  res.json(items);
}

export async function createTemplate(req, res) {
  const doc = await SpecTemplate.create(req.body);
  res.status(201).json(doc);
}

export async function updateTemplate(req, res) {
  const doc = await SpecTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!doc) return res.status(404).json({ message: "NOT_FOUND" });
  res.json(doc);
}

export async function deleteTemplate(req, res) {
  const doc = await SpecTemplate.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: "NOT_FOUND" });
  res.json({ ok: true });
}

// ---------- Dictionaries ----------
export async function getDictionaries(req, res) {
  const doc = await Dictionary.findById("default");
  res.json(doc || { _id: "default" });
}

export async function upsertDictionaries(req, res) {
  const doc = await Dictionary.findByIdAndUpdate(
    "default",
    { $set: req.body },
    { upsert: true, new: true }
  );
  res.json(doc);
}
