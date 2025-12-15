// server/middleware/onlineMiddleware.js
import User from "../models/userModel.js";

// змінюємо назву на setUserOnline, щоб збігалося з імпортом
export const setUserOnline = async (req, res, next) => {
  if (!req.user) return next(); // якщо користувач не авторизований

  try {
    await User.findByIdAndUpdate(req.user._id, { isOnline: true });
    next();
  } catch (err) {
    console.error("Failed to update online status:", err);
    next();
  }
};
