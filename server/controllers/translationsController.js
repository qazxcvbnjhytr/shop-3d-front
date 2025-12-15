import Translation from "../models/Translation.js";

export const getTranslationsByLang = async (req, res) => {
  try {
    const { lang } = req.params;

    if (!lang) {
      return res.status(400).json({ message: "Language is required" });
    }

    const translation = await Translation.findOne({ lang }).lean();

    if (!translation) {
      return res.status(404).json({
        message: `Translations for '${lang}' not found`
      });
    }

    // 🔥 ПОВЕРТАЄМО ЧИСТИЙ ОБʼЄКТ ДЛЯ ФРОНТА
    return res.json(translation);

  } catch (error) {
    console.error("Translation controller error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
