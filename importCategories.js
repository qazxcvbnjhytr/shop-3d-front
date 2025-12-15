require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');

// Підключення до MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const TranslationSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  translations: Object
});

const Translation = mongoose.model('Translation', TranslationSchema);

// Завантаження JSON локалей
const en = JSON.parse(fs.readFileSync('./client/src/locales/en/translation.json', 'utf-8'));
const ua = JSON.parse(fs.readFileSync('./client/src/locales/ua/translation.json', 'utf-8'));

// Рекурсивна функція для проходження обʼєкта JSON і створення ключів
function flattenTranslations(obj, prefix = '') {
  let result = {};
  for (const k in obj) {
    const newKey = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object') {
      result = { ...result, ...flattenTranslations(obj[k], newKey) };
    } else {
      result[newKey] = obj[k];
    }
  }
  return result;
}

async function importLocales() {
  const enFlat = flattenTranslations(en);
  const ukFlat = flattenTranslations(ua);

  for (const key in enFlat) {
    const exists = await Translation.findOne({ key });
    if (!exists) {
      await Translation.create({
        key,
        translations: {
          en: enFlat[key],
          ua: ukFlat[key] || enFlat[key]
        }
      });
      console.log(`Translation "${key}" added`);
    } else {
      console.log(`Translation "${key}" already exists`);
    }
  }
  console.log('All locales imported!');
  mongoose.disconnect();
}

importLocales();
