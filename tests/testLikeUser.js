import axios from "axios";
import crypto from "crypto";

const API_URL = "http://localhost:5000/api"; // твій бекенд
let token;
let userId;

const randomEmail = `liketester_${Date.now()}@example.com`;
const testUser = {
  name: "Like User Tester",
  email: randomEmail,
  password: "password123",
};

const testProduct = {
  productId: "68ee7fd2aacb6bd0a083a0d4",
  productName: "Test Bed",
  productCategory: "beds",
  productImage: "test.jpg",
  discount: 10,
};

const headers = () => ({
  headers: { Authorization: `Bearer ${token}` }
});

(async () => {
  try {
    console.log("1️⃣ Створення тестового користувача...");
    const registerRes = await axios.post(`${API_URL}/auth/register`, testUser);
    userId = registerRes.data.user.id;
    token = registerRes.data.token;
    console.log("User created:", registerRes.data.user);

    console.log("\n2️⃣ Додавання лайка...");
    const addLikeRes = await axios.post(
      `${API_URL}/likes/${testProduct.productId}/toggle`,
      testProduct,
      headers()
    );
    console.log("Likes after adding:", addLikeRes.data);

    console.log("\n3️⃣ Повторний клік (toggle) — видалення лайка...");
    const removeLikeRes = await axios.post(
      `${API_URL}/likes/${testProduct.productId}/toggle`,
      testProduct,
      headers()
    );
    console.log("Likes after removing:", removeLikeRes.data);

    console.log("\n4️⃣ Знову додамо лайк для перевірки дублювання...");
    await axios.post(`${API_URL}/likes/${testProduct.productId}/toggle`, testProduct, headers());
    await axios.post(`${API_URL}/likes/${testProduct.productId}/toggle`, testProduct, headers()); // toggle видалить
    const finalRes = await axios.get(`${API_URL}/likes`, headers());
    console.log("Final likes in user:", finalRes.data);

    console.log("\n✅ Тест лайка (user.likes) пройшов успішно!");
    console.log("🧹 Не забудь видалити тестового користувача вручну або додати DELETE /users/:id");
  } catch (err) {
    if (err.response) {
      console.error("Помилка відповіді сервера:", err.response.data);
    } else {
      console.error(err);
    }
  }
})();
