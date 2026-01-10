// server/controllers/authController.js

import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Утиліта для безпечного повернення об'єкта користувача без пароля
const getUserResponse = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    // 🔥 ДОДАНО: повертаємо статус, щоб фронт знав
    status: user.status, 
    isOnline: user.isOnline,
    likes: user.likes || [],
  };
};

// ---------- Реєстрація ----------
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Будь ласка, введіть ім'я, Email та пароль." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Пароль повинен містити мінімум 6 символів." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Користувач з таким Email вже існує" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      status: "active", // За замовчуванням активний
      likes: []
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      user: getUserResponse(user),
      token,
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: `Помилка валідації: ${err.message}` });
    }
    console.error("Помилка реєстрації:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------- Логін ----------
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Будь ласка, введіть Email та пароль." });
  }

  try {
    const user = await User.findOne({ email });
    
    // 1. Перевірка чи юзер існує
    if (!user) return res.status(400).json({ message: "Невірні дані авторизації" });

    // 🔥🔥🔥 2. ПЕРЕВІРКА НА БАН (КЛЮЧОВИЙ МОМЕНТ) 🔥🔥🔥
    if (user.status === 'banned') {
        // Повертаємо 403 Forbidden, щоб фронт перекинув на BannedPage
        return res.status(403).json({ message: "Ваш акаунт заблоковано адміністратором." });
    }

    // 3. Перевірка пароля
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Невірні дані авторизації" });

    // Оновлюємо статус онлайн
    user.isOnline = true;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      user: getUserResponse(user),
      token,
    });

  } catch (err) {
    console.error("Помилка логіну:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------- Отримання поточного користувача ----------
export const getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Немає доступу. Недійсний токен." });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔥 Додаткова перевірка: якщо забанили під час сесії - викидаємо
    if (user.status === 'banned') {
        return res.status(403).json({ message: "Ваш акаунт заблоковано." });
    }

    res.status(200).json(getUserResponse(user));
  } catch (err) {
    console.error("Помилка при отриманні користувача:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------- TOGGLE LIKE ----------
export const toggleLike = async (req, res) => {
  const { productId, productName, productCategory, productImage, discount, price } = req.body;
  const targetId = productId || req.body._id || req.body.id;

  if (!targetId) {
    return res.status(400).json({ message: "ProductId є обов'язковим." });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const index = user.likes.findIndex(like => String(like.productId) === String(targetId));

    if (index > -1) {
      console.log(`[ToggleLike] Removing ${targetId}`);
      user.likes.splice(index, 1);
    } else {
      console.log(`[ToggleLike] Adding ${targetId}`);
      user.likes.push({
        productId: targetId,
        productName: productName || "Unknown",
        productCategory: productCategory || "",
        productImage: productImage || "",
        discount: Number(discount || 0),
        price: Number(price || 0)
      });
    }

    await user.save();
    const updatedUser = await User.findById(req.user.id).select("-password");
    res.status(200).json(getUserResponse(updatedUser));

  } catch (err) {
    console.error("Помилка toggleLike:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------- Forgot / Reset Password ----------
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Введіть Email для відновлення." });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.status(200).json({ message: "Reset code sent (simulation)" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  res.status(200).json({ message: "Password reset logic placeholder" });
};