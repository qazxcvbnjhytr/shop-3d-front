// server/importTranslationsFlat.js
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Translation from "./models/Translation.js";

const mongoUri = "mongodb://127.0.0.1:27017/shop-3d"; // твоя БД
const localesPath = path.join(process.cwd(), "../client/src/locales"); // шлях до JSON

// Функція для перетворення вкладеного об'єкта у flat вигляд
function flattenObject(obj, parentKey = "", res = {}) {
  for (const key in obj) {
    if (Object.hasOwnProperty.call(obj, key)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      if (typeof obj[key] === "object" && obj[key] !== null) {
        flattenObject(obj[key], newKey, res);
      } else {
        res[newKey] = obj[key];
      }
    }
  }
  return res;
}

const loadTranslations = async () => {
  await mongoose.connect(mongoUri);
  const languages = fs.readdirSync(localesPath);

  for (const lang of languages) {
    const filePath = path.join(localesPath, lang, "translation.json");
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const flatContent = flattenObject(content);

      // Видаляємо старі переклади для цієї мови
      await Translation.deleteMany({ language: lang });

      // Додаємо у колекцію
      const translationDocs = Object.entries(flatContent).map(([key, value]) => ({
        language: lang,
        key,
        value
      }));

      await Translation.insertMany(translationDocs);
      console.log(`Loaded translations for ${lang}`);
    }
  }

  mongoose.disconnect();
};

loadTranslations().catch(console.error);
