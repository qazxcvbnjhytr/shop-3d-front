require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Обробник команди /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Доброго дня! Чим можу допомогти?');
});

// Обробник інших повідомлень (опціонально, якщо потрібно)
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  // Можете додати інші обробники або залишити цей блок порожнім
});

console.log('Бот запущено...');
