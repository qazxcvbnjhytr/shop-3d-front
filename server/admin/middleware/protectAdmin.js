// server/admin/middleware/protectAdmin.js
export function protectAdmin(req, res, next) {
  // protect middleware має поставити req.user
  const u = req.user;

  // Підлаштуй під свою модель користувача:
  // role: "admin" | "user" або isAdmin: true/false
  const ok =
    !!u &&
    (u.role === "admin" ||
      u.isAdmin === true ||
      u.is_admin === true);

  if (!ok) {
    return res.status(403).json({ message: "ADMIN_ONLY" });
  }

  next();
}
