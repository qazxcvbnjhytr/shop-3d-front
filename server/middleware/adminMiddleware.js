// Шлях: server/middleware/adminMiddleware.js

export const protectAdmin = (req, res, next) => {
  // authMiddleware вже має поставити req.user
  const user = req.user;

  if (user && user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as admin (Access Denied)" });
  }
};