import axios from "axios";
import fs from "fs";
import FormData from "form-data";

const API_URL = "http://localhost:5000/api";

(async () => {
  try {
    // --- 1. Створення admin користувача ---
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Product Tester",
      email: `product_tester_${Date.now()}@example.com`,
      password: "123456",
      role: "admin"
    });
    const token = registerRes.data.token;
    console.log("✅ Admin user created");

    // --- 2. Додавання продукту ---
    const formData = new FormData();
    formData.append("name_ua", "Тестове ліжко");
    formData.append("name_en", "Test Bed");
    formData.append("category", "beds");
    formData.append("type", "bed");
    formData.append("material", "wood");
    formData.append("manufacturer", "TestMaker");
    formData.append("warranty", "24");
    formData.append("width", "150");
    formData.append("height", "100");
    formData.append("depth", "210");
    formData.append("weight", "120");
    formData.append("bedSize", "140x200");
    formData.append("price", "999");
    formData.append("discount", "10");
    formData.append("manualLink", "/manuals/test.pdf");
    formData.append("imageFile", fs.createReadStream("./test-bed.jpg"));
    formData.append("modelFile", fs.createReadStream("./test-bed.glb"));

    const productRes = await axios.post(`${API_URL}/products`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log("✅ Product added:", productRes.data);

    // --- 3. Перевірка полів ---
    const p = productRes.data;
    ["type","material","manufacturer","warranty","width","height","depth","weight","bedSize","price","discount","manualLink","image","modelUrl"].forEach(key=>{
      if(!p[key]) console.error(`❌ Поле "${key}" не додалося`);
      else console.log(`✅ Поле "${key}" є`);
    });

  } catch(err) {
    console.error(err.response?.data || err);
  }
})();
