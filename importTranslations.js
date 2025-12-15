// C:\Users\Lenovo\shop-3d\importTranslations.js

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// 1. Завантажуємо змінні оточення (.env)
require('dotenv').config(); 

// 2. Вказуємо шлях до Mongoose-моделі (Переконайся, що цей шлях коректний!)
const Translation = require('./server/models/Translation'); 

// 3. 🔥🔥 КОНФІГУРАЦІЯ URI: Використовуємо MONGO_URI, як у твоєму .env
const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shop_3d_db'; 

// 4. Шляхи до локальних JSON-файлів (для Сеньйорського імпорту з файлів)
const UK_LOCALE_PATH = path.join(__dirname, 'client', 'src', 'locales', 'ua', 'translation.json');
const EN_LOCALE_PATH = path.join(__dirname, 'client', 'src', 'locales', 'en', 'translation.json');


/**
 * Функція для перетворення вкладеного об'єкта JSON у плоский список (key.subkey: value)
 * Це необхідно для зберігання у MongoDB у форматі (language, key, value)
 * * @param {Object} obj - Вкладений об'єкт перекладів
 * @param {string} language - Мова ('ua' або 'en')
 * @param {string} parentKey - Батьківський ключ для рекурсії
 * @returns {Array} Плоский масив документів для MongoDB
 */
function flattenObject(obj, language, parentKey = '') {
    let result = [];
    for (const key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) {
            const newKey = parentKey ? `${parentKey}.${key}` : key;
            const value = obj[key];

            // Рекурсія, якщо це вкладений об'єкт
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                result = result.concat(flattenObject(value, language, newKey));
            } else {
                // Додаємо документ до масиву
                result.push({
                    language,
                    key: newKey,
                    value
                });
            }
        }
    }
    return result;
}

/**
 * Основна функція імпорту, яка використовує Bulk Write для Upsert.
 */
const importData = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('MongoDB Connected to:', DB_URI);

        // 1. Читання та підготовка даних
        const ukJson = JSON.parse(fs.readFileSync(UK_LOCALE_PATH, 'utf-8'));
        const enJson = JSON.parse(fs.readFileSync(EN_LOCALE_PATH, 'utf-8'));

        let allFlatData = [];
        allFlatData = allFlatData.concat(flattenObject(ukJson, 'ua'));
        allFlatData = allFlatData.concat(flattenObject(enJson, 'en'));

        console.log(`Prepared ${allFlatData.length} translation records for import.`);
        console.log('Starting mass UPSERT operation (Update or Insert)...');
        // 

        // 2. Створення масиву операцій для масового запису
        const bulkOps = allFlatData.map(doc => ({
            updateOne: {
                // Фільтруємо по унікальній парі (мова + ключ)
                filter: { 
                    language: doc.language, 
                    key: doc.key 
                },
                // Встановлюємо нове значення
                update: { $set: { value: doc.value } },
                // Якщо документ не знайдено, створити його
                upsert: true 
            }
        }));

        // 3. Виконання масової операції
        const result = await Translation.bulkWrite(bulkOps);

        console.log(`\n✅ Data successfully processed!`);
        console.log(`- Inserted (Upserted): ${result.upsertedCount}`);
        console.log(`- Updated (Matched/Modified): ${result.modifiedCount}`);
        console.log(`- Total processed: ${allFlatData.length}`);

    } catch (error) {
        console.error('❌ FATAL ERROR DURING DATA IMPORT:', error);
        
        if (error.code === 'ENOENT') {
            console.error('\n*** ПЕРЕВІРКА: Переконайся, що файли translation.json існують за шляхом: client/src/locales/ua/translation.json');
        } else if (error.name === 'MongooseError' || error.name === 'MongoNetworkError') {
             console.error('\n*** ПЕРЕВІРКА: Переконайся, що MongoDB сервер ЗАПУЩЕНИЙ і MONGO_URI коректний.');
        } else if (error.writeErrors) {
             console.error('\n*** ПЕРЕВІРКА: Була помилка валідації/дублікатів (ENUM error). Перевір свої дані.');
        }

        process.exit(1);
    } finally {
        // Завжди закриваємо з'єднання
        if (mongoose.connection.readyState === 1) {
             mongoose.connection.close();
        }
    }
};

importData();