import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config(); // підхоплюємо .env

console.log('MONGO_URI:', process.env.MONGO_URI); // перевірка, що змінна читається

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Перевірка URI
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI не заданий у .env');
}

// Підключення до MongoDB
await mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
console.log('MongoDB connected');

// Схема для товарів
const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  image: String,
  modelUrl: String,
  width: Number,
  height: Number,
  depth: Number,
  weight: Number
});

const Product = mongoose.model('Product', productSchema);

// Імпорт файлів
const files = [
  'benches.js',
  'chairs.js',
  'desks.js',
  'mirrors.js',
  'shelves.js',
  'sofas.js',
  'tables.js',
  'wardrobes.js'
];

for (const file of files) {
  const filePath = path.join(__dirname, 'src', 'data', 'catalog', file);
  const dataModule = await import(`file://${filePath}`);
  const data = dataModule.default || dataModule;
  try {
    await Product.insertMany(data);
    console.log(`${file} імпортовано успішно`);
  } catch (err) {
    console.error(`Помилка при імпорті ${file}:`, err);
  }
}

console.log('Імпорт завершено!');
await mongoose.disconnect();
