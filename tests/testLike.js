import axios from "axios";
import crypto from "crypto";

const API_URL = "http://localhost:5000/api"; // твій сервер
const PRODUCT_ID = "68ee7fd2aacb6bd0a083a0d4"; // конкретний товар

const randomEmail = () => `liketester_${Date.now()}_${crypto.randomBytes(2).toString("hex")}@example.com`;

(async () => {
  try {
    console.log("1️⃣ Створення тестового користувача...");
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Like Tester",
      email: randomEmail(),
      password: "123456"
    });
    const user = registerRes.data.user;
    const token = registerRes.data.token;
    console.log("User created:", user);

    const headers = { Authorization: `Bearer ${token}` };

    console.log(`\n2️⃣ Додавання лайка до товару ${PRODUCT_ID}...`);
    let toggleRes = await axios.post(
      `${API_URL}/likes/${PRODUCT_ID}/toggle`,
      {
        productName: "Test Bed",
        productCategory: "Beds",
        productImage: "bed.jpg",
        discount: 0
      },
      { headers }
    );
    console.log("Like toggled (added):", toggleRes.data);

    console.log("\n3️⃣ Отримання всіх лайків користувача...");
    let likesRes = await axios.get(`${API_URL}/likes`, { headers });
    console.log("User likes:", likesRes.data);

    console.log(`\n4️⃣ Видалення лайка від товару ${PRODUCT_ID}...`);
    toggleRes = await axios.post(`${API_URL}/likes/${PRODUCT_ID}/toggle`, {}, { headers });
    console.log("Like toggled (removed):", toggleRes.data);

    console.log("\n✅ Тест лайка пройшов успішно!");
    console.log("🧹 Не забудь видалити тестового користувача вручну або додати DELETE /users/:id");

  } catch (err) {
    if (err.response) {
      console.error("Помилка відповіді сервера:", err.response.data);
    } else {
      console.error(err);
    }
  }
})();
