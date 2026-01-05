export function guestMenuKeyboard() {
  return {
    keyboard: [
      [{ text: "📝 Реєстрація" }, { text: "🔐 Вхід" }],
      [{ text: "💬 Підтримка" }],
      [{ text: "❓ Допомога" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}

export function authedMenuKeyboard() {
  return {
    keyboard: [
      [{ text: "💬 Підтримка" }],
      [{ text: "🚪 Вийти" }, { text: "❓ Допомога" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}

export function cancelKeyboard() {
  return {
    keyboard: [[{ text: "❌ Скасувати" }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}
