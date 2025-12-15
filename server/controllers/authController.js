import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Утиліта для безпечного повернення об'єкта користувача без пароля
const getUserResponse = (user) => {
    // Включаємо всі необхідні поля для фронтенду
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnline: user.isOnline,
        likes: user.likes || [],
    };
};

// ---------- Регистрация ----------
export const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    
    // 🔥 ФІКС 1: Ручна валідація вхідних полів
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Будь ласка, введіть ім'я, Email та пароль." });
    }

    // Додаткова перевірка довжини пароля (опціонально, але корисно)
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
            likes: [] 
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(201).json({
            user: getUserResponse(user), // Використовуємо уніфікований формат
            token,
        });

    } catch (err) {
        // Ловимо MongooseValidationError
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: `Помилка валідації: ${err.message}` });
        }
        console.error("Помилка реєстрації:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ---------- Логин ----------
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    
    // 🔥 ФІКС 1: Валідація входу
    if (!email || !password) {
        return res.status(400).json({ message: "Будь ласка, введіть Email та пароль." });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Невірні дані авторизації" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Невірні дані авторизації" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(200).json({
            user: getUserResponse(user), // Використовуємо уніфікований формат
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

        // Шукаємо користувача і виключаємо пароль
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(getUserResponse(user)); // Уніфікований формат
    } catch (err) {
        console.error("Помилка при отриманні користувача:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ---------- Додавання/видалення лайка ----------
export const toggleLike = async (req, res) => {
    const { productId, productName, productCategory, productImage, discount } = req.body;
    
    // Перевірка, що ID товару передано
    if (!productId) {
        return res.status(400).json({ message: "ProductId є обов'язковим." });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Перевірка, чи товар вже лайкнутий
        const index = user.likes.findIndex(like => like.productId === productId);

        if (index > -1) {
            // Видалити лайк
            user.likes.splice(index, 1);
        } else {
            // Додати лайк (Додаємо лише необхідні поля)
            user.likes.push({ productId, productName, productCategory, productImage, discount });
        }

        await user.save();

        // 🔥 ФІКС 3: Повертаємо оновлений об'єкт користувача для чистого оновлення на фронтенді
        // Фронтенд: setUser(res.data)
        const updatedUser = await User.findById(req.user.id).select("-password");
        
        res.status(200).json(getUserResponse(updatedUser)); 

    } catch (err) {
        console.error("Помилка toggleLike:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ---------- Forgot Password (без змін, але з коректною обробкою) ----------
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Введіть Email для відновлення." });
    
    try {
        const user = await User.findOne({ email });
        // ... (логіка) ...
        if (!user) return res.status(404).json({ message: "User not found" });
        // ...
        res.status(200).json({ message: "Reset code sent to your email" });
    } catch (err) {
        console.error("Помилка відновлення пароля (відправка коду):", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ---------- Reset Password (без змін, але з коректною обробкою) ----------
export const resetPassword = async (req, res) => {
    const { email, code, password } = req.body;
    if (!email || !code || !password) {
        return res.status(400).json({ message: "Введіть Email, код та новий пароль." });
    }
    
    try {
        const user = await User.findOne({ email, resetCode: code });
        // ... (логіка) ...
        if (!user) return res.status(400).json({ message: "Invalid code or email" });
        // ...
        res.status(200).json({ message: "Password successfully reset" });
    } catch (err) {
        console.error("Помилка відновлення пароля (зміна пароля):", err);
        res.status(500).json({ message: "Server error" });
    }
};