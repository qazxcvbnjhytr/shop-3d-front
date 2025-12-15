import React, { useState, useEffect } from "react";
import axios from "axios";
import "../style/CategoriesAdmin.css";

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);

  const [formData, setFormData] = useState({
    name_ua: "",
    name_en: "",
    category: "",
    imageUrl: "",
    imageFile: null,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/categories", { withCredentials: true });
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Помилка при завантаженні категорій", err);
    }
  };

  const handleOpenModal = (cat = null) => {
    setCurrentCategory(cat);
    
    // Ініціалізація: використовуємо names.ua/en, якщо вони є. 
    setFormData({
      name_ua: cat?.names?.ua || cat?.name || "", // Резерв cat.name для старих об'єктів
      name_en: cat?.names?.en || "",
      category: cat?.category || "",
      imageUrl: cat?.image || "",
      imageFile: null,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setCurrentCategory(null);
    setFormData({ name_ua: "", name_en: "", category: "", imageUrl: "", imageFile: null });
    setShowModal(false);
  };

  const generateKeyFromName = (name) =>
    name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imageFile") setFormData((prev) => ({ ...prev, imageFile: files[0] }));
    else if (name === "name_ua") {
      // Генерація ключа на основі UA назви
      const autoKey = generateKeyFromName(value);
      // Оновлюємо обидва поля: name_ua та category (ключ)
      setFormData((prev) => ({ ...prev, name_ua: value, category: autoKey }));
    } else setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateTempId = () => `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const handleSubmit = async () => {
    // Валідація: обидві назви обов'язкові
    if (!formData.name_ua.trim() || !formData.name_en.trim() || !formData.category.trim()) {
      alert("Вкажи українську та англійську назви, а також ключ категорії!");
      return;
    }

    const tempId = !currentCategory?._id ? generateTempId() : null;

    try {
      const dataToSend = new FormData();
      dataToSend.append("name_ua", formData.name_ua);
      dataToSend.append("name_en", formData.name_en);
      dataToSend.append("category", formData.category);
      if (formData.imageFile) dataToSend.append("image", formData.imageFile);
      else if (formData.imageUrl) dataToSend.append("imageUrl", formData.imageUrl);

      let savedCategory;

      if (currentCategory?._id) {
        // --- ОНОВЛЕННЯ (PUT) ---
        const res = await axios.put(
          `/api/categories/${currentCategory._id.$oid || currentCategory._id}`,
          dataToSend,
          { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
        );
        savedCategory = res.data;
        
        // Локальне оновлення стану
        setCategories((prev) =>
          prev.map((cat) =>
            (cat._id.$oid || cat._id) === (savedCategory._id.$oid || savedCategory._id)
              ? { ...savedCategory, names: { ua: formData.name_ua, en: formData.name_en } }
              : cat
          )
        );
      } else {
        // --- СТВОРЕННЯ (POST) ---
        
        // 1. Створення тимчасового об'єкта для миттєвого відображення
        const tempCategory = {
          _id: tempId,
          names: { ua: formData.name_ua, en: formData.name_en },
          category: formData.category,
          image: formData.imageFile
            ? URL.createObjectURL(formData.imageFile)
            : formData.imageUrl || "",
        };
        setCategories((prev) => [...prev, tempCategory]);

        // 2. Надсилання реального запиту
        const res = await axios.post("/api/categories", dataToSend, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
        savedCategory = res.data;

        // 3. Заміна тимчасового об'єкта на реальний
        setCategories((prev) =>
          prev.map((cat) => (cat._id === tempId ? savedCategory : cat))
        );
      }

      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert(`Помилка при збереженні категорії: ${err.response?.data?.message || err.message}`);

      // 🚩 ВІДНОВЛЕННЯ СТАНУ ПІСЛЯ ПОМИЛКИ (якщо це була нова категорія)
      if (tempId) {
        setCategories((prev) => prev.filter((cat) => cat._id !== tempId));
      }
    }
  };

  // 🚀 ОНОВЛЕНА ЛОГІКА handleDelete
  const handleDelete = async (catId) => {
    // Нормалізація ID для перевірки
    const id = catId?.$oid || catId; 
    
    if (!window.confirm("Видалити категорію?")) return;

    // Видаляємо зі стану одразу, щоб UX був швидшим
    setCategories((prev) =>
      prev.filter((cat) => (cat._id.$oid || cat._id) !== id)
    );

    // 🚩 ПЕРЕВІРКА НА ТИМЧАСОВИЙ ID
    const isTempId = typeof id === 'string' && id.startsWith('temp-');

    if (isTempId) {
      // Якщо це тимчасовий ID, елемент вже видалено зі стану, запит на сервер не потрібен
      return;
    }

    try {
      // Якщо це реальний ID, надсилаємо запит на сервер
      await axios.delete(`/api/categories/${id}`, { withCredentials: true });
    } catch (err) {
      console.error(err);
      alert("Помилка при видаленні категорії. Спробуйте оновити сторінку.");
      // Оскільки видалення зі стану відбувається до запиту, при помилці 
      // категорія може зникнути, хоча на сервері вона залишилася. 
      // Просте рішення — попросити користувача оновити сторінку.
      fetchCategories(); // Або примусове оновлення списку
    }
  };

  return (
    <div className="categories-admin-container">
      <h2 className="categories-admin-title">Categories Admin</h2>

      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <button className="add-category-btn" onClick={() => handleOpenModal()}>
          Add Category
        </button>
      </div>

      <div className="categories-table-container">
        <table className="categories-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Name (UA)</th>
              <th>Name (EN)</th>
              <th>Key</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
   <tbody>
  {categories.map((cat, index) => (
    <tr
      key={cat._id.$oid || cat._id}
      className={index % 2 === 0 ? "even-row" : "odd-row"} // <-- додано
    >
      <td data-label="№">{index + 1}</td>
      <td data-label="Name (UA)">{cat.names?.ua || cat.name || ''}</td>
      <td data-label="Name (EN)">{cat.names?.en || ''}</td>
      <td data-label="Key">{cat.category}</td>
      <td data-label="Image">
        {cat.image && <img src={cat.image} alt={cat.name} className="category-image" />}
      </td>
      <td data-label="Actions">
        <button className="edit-btn" onClick={() => handleOpenModal(cat)}>Edit</button>
        <button className="delete-btn" onClick={() => handleDelete(cat._id)}>Delete</button>
      </td>
    </tr>
  ))}
</tbody>

        </table>
      </div>

   {showModal && (
  <div className="modal-overlay" onClick={handleCloseModal}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h3 className="modal-title">{currentCategory ? "Edit Category" : "Add Category"}</h3>

      <div className="input-with-tooltip">
        <input
          type="text"
          name="name_ua"
          placeholder="Category Name (UA)"
          value={formData.name_ua}
          onChange={handleChange}
          className="modal-input"
        />
        <span className="tooltip-icon">❓
          <span className="tooltip-text">Введіть українську назву категорії. Наприклад: "Книги"</span>
        </span>
      </div>

      <div className="input-with-tooltip">
        <input
          type="text"
          name="name_en"
          placeholder="Category Name (EN)"
          value={formData.name_en}
          onChange={handleChange}
          className="modal-input"
        />
        <span className="tooltip-icon">❓
          <span className="tooltip-text">Введіть англійську назву категорії. Наприклад: "Books"</span>
        </span>
      </div>

      <div className="input-with-tooltip">
        <input
          type="text"
          name="category"
          placeholder="Category Key"
          value={formData.category}
          onChange={handleChange}
          className="modal-input"
        />
        <span className="tooltip-icon">❓
          <span className="tooltip-text">Унікальний ключ категорії, латиницею, без пробілів. Наприклад: "books"</span>
        </span>
      </div>

      <div className="input-with-tooltip">
        <input
          type="text"
          name="imageUrl"
          placeholder="Image URL"
          value={formData.imageUrl}
          onChange={handleChange}
          className="modal-input"
        />
        <span className="tooltip-icon">❓
          <span className="tooltip-text">Посилання на зображення категорії. Можна залишити порожнім, якщо завантажуєте файл</span>
        </span>
      </div>

      <div className="input-with-tooltip">
        <input
          type="file"
          name="imageFile"
          accept="image/*"
          onChange={handleChange}
          className="modal-input"
        />
        <span className="tooltip-icon">❓
          <span className="tooltip-text">Завантажте зображення категорії з комп'ютера. Можна залишити порожнім, якщо використовуєте URL</span>
        </span>
      </div>

      {(formData.imageUrl || formData.imageFile) && (
        <img
          src={formData.imageFile ? URL.createObjectURL(formData.imageFile) : formData.imageUrl}
          alt="Preview"
          className="image-preview"
        />
      )}

      <div className="modal-buttons">
        <button className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
        <button className="submit-btn" onClick={handleSubmit}>
          {currentCategory ? "Update" : "Add"}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}