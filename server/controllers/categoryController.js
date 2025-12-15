import Category from "../models/Category.js";

// Отримати всі категорії
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (err) {
    console.error("Failed to get categories:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Додати категорію
export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const newCategory = new Category({ name });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    console.error("Failed to add category:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Редагування категорії
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const updated = await Category.findByIdAndUpdate(id, { name }, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    console.error("Failed to update category:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Видалення категорії
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: "Category deleted" });
  } catch (err) {
    console.error("Failed to delete category:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
