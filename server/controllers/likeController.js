import User from "../models/userModel.js"; // Твоя модель

// 1. Отримати всі лайки (просто віддаємо масив з юзера)
export const getLikes = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Користувача не знайдено" });
    
    // Віддаємо саме масив лайків
    res.json(user.likes || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. ДОДАТИ ЛАЙК (В МАСИВ ЮЗЕРА)
export const addLike = async (req, res) => {
  try {
    const { id } = req.params; // ID товару
    const { productName, productCategory, productImage, discount } = req.body;

    // Магія MongoDB: $addToSet додає в масив likes, ТІЛЬКИ якщо там немає такого productId
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $addToSet: {
          likes: {
            productId: id,
            productName: productName || "Unknown",
            productCategory: productCategory || "General",
            productImage: productImage || "",
            discount: discount || 0
          }
        }
      },
      { new: true } // Повертає вже оновленого юзера, щоб ми бачили результат
    );

    if (!user) return res.status(404).json({ message: "Користувача не знайдено" });

    res.json(user.likes); // Віддаємо оновлений масив
  } catch (err) {
    console.error("Помилка додавання лайка:", err);
    res.status(500).json({ message: "Не вдалося додати лайк" });
  }
};

// 3. ВИДАЛИТИ ЛАЙК (З МАСИВУ ЮЗЕРА)
export const removeLike = async (req, res) => {
  try {
    const { id } = req.params;

    // Магія MongoDB: $pull ВИРИВАЄ з масиву елемент, де productId == id
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: { likes: { productId: id } }
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "Користувача не знайдено" });

    res.json(user.likes); // Віддаємо оновлений масив
  } catch (err) {
    console.error("Помилка видалення лайка:", err);
    res.status(500).json({ message: "Не вдалося видалити лайк" });
  }
};