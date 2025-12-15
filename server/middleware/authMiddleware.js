import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      console.log("[AUTH] Token found.");
    }

    if (!token) {
      console.warn("[AUTH WARNING] No token.");
      return res.status(401).json({ message: "Не авторизовано, токен відсутній" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET не встановлено");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[AUTH] Token verified. User ID: ${decoded.id}`);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.error("[AUTH ERROR] User not found.");
      return res.status(401).json({ message: "Не авторизовано, користувач не знайдений" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Користувача заблоковано" });
    }

    if (!user.isOnline) {
      user.isOnline = true;
      user.lastActive = new Date();
      await user.save();
    }

    req.user = user;
    next();

  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Токен прострочено" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Токен недійсний" });
    }

    console.error("[AUTH FATAL]", err);
    res.status(500).json({ message: "Помилка авторизації" });
  }
};

export const admin = (req, res, next) => {
  if (req.user?.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Доступ лише для адміністратора" });
  }
};
