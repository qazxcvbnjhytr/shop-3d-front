import User from "../models/userModel.js"; 
import bcrypt from "bcryptjs";
// Якщо у тебе є модель Product, розкоментуй. Якщо ні - код нижче працюватиме і без неї (там стоїть захист).
import Product from "../models/Product.js"; 

// === СТАТИСТИКА (DASHBOARD) ===
export const getStats = async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    // Пробуємо отримати кількість продуктів, якщо модель існує
    const productsCount = Product ? await Product.countDocuments().catch(() => 0) : 0;
    
    res.json({
      users: usersCount,
      products: productsCount,
      orders: 0 // Заглушка для замовлень
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Error loading stats" });
  }
};

// === УПРАВЛІННЯ ЮЗЕРАМИ ===

// 1. Отримати всіх користувачів
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password") // Паролі не віддаємо
      .sort({ createdAt: -1 }); // Спочатку нові
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Failed to load users" });
  }
};

// 2. Створити користувача (через адмінку)
export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, status } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Хешуємо пароль
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Формуємо повне ім'я
    const fullName = `${firstName || ""} ${lastName || ""}`.trim() || "User";

    const user = await User.create({
      name: fullName,
      email,
      password: hash,
      role: role || "user",
      status: status || "active", // За замовчуванням активний
      isOnline: false
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
};

// 3. Оновити користувача (Редагування + БАН)
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Оновлюємо поля, якщо вони прийшли
    if (req.body.firstName || req.body.lastName) {
      user.name = `${req.body.firstName || ""} ${req.body.lastName || ""}`.trim();
    }
    if (req.body.email) user.email = req.body.email;
    if (req.body.role) user.role = req.body.role;
    
    // 🔥 Оновлення статусу (Active/Banned)
    if (req.body.status) user.status = req.body.status;

    // Якщо прийшов новий пароль - хешуємо і зберігаємо
    if (req.body.password && req.body.password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      isOnline: updatedUser.isOnline
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
};

// 4. Видалити користувача
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ message: "User removed" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};