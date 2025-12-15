// Тестовий контролер для адміна
export const getAdminDashboard = async (req, res) => {
  try {
    res.status(200).json({
      message: `Welcome Admin ${req.user.name}`,
      user: req.user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
