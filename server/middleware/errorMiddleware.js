/**
 * =========================================
 * 1. Обробник для неіснуючих маршрутів (404 Not Found)
 * =========================================
 */
const notFound = (req, res, next) => {
  // Створюємо новий об'єкт помилки з інформативним повідомленням
  const error = new Error(`Not Found - ${req.originalUrl}`);
  
  // Встановлюємо статус відповіді на 404
  res.status(404);
  
  // Передаємо помилку наступному middleware, яким буде errorHandler
  next(error); 
};

/**
 * =========================================
 * 2. Загальний обробник помилок Express (ErrorHandler)
 * =========================================
 * Це middleware з чотирма аргументами: (err, req, res, next).
 * Він викликається, коли в будь-якому місці роутингу чи middleware 
 * виникає помилка (наприклад, через next(error)).
 */
const errorHandler = (err, req, res, next) => {
  // Визначаємо HTTP статус код. 
  // Якщо статус був встановлений (наприклад, 401, 403, 404), використовуємо його.
  // Якщо він все ще 200 (що є стандартним для Express до встановлення), 
  // встановлюємо 500 (Internal Server Error).
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode);

  res.json({
    // Повідомлення про помилку
    message: err.message,
    
    // Включаємо стек помилок лише в режимі розробки (development).
    // У production це небезпечно, оскільки розкриває деталі структури сервера.
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };