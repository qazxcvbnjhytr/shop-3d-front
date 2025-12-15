import React, { useMemo, useEffect } from "react";
import "./FormsAdd.css";
import { FaCalculator, FaTag, FaImages } from "react-icons/fa";
import { useTranslation } from "../../../hooks/useTranslation";

const MAX_IMAGES = 10;

export default function FormsAdd({
  formData,
  setFormData,
  handleAction,
  closeModal,
  categories,
  isEditing,
}) {
  const { t } = useTranslation();
  const tr = t?.admin?.productForm || {};

  /* 🔒 disable page scroll */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    let processedValue = value;

    if (["price", "discount"].includes(name)) {
      processedValue = value === "" ? "" : Number(value);
    }

    if (files && files.length > 0) {
      if (name === "images") {
        if (files.length > MAX_IMAGES) {
          alert(tr.maxImages?.replace("{n}", MAX_IMAGES));
          e.target.value = null;
          return;
        }
        setFormData((p) => ({ ...p, images: Array.from(files) }));
      } else {
        setFormData((p) => ({ ...p, [name]: files[0] }));
      }
    } else {
      setFormData((p) => ({ ...p, [name]: processedValue }));
    }
  };

  const calculatedPrice = useMemo(() => {
    const price = Number(formData.price);
    const discount = Number(formData.discount);
    if (price > 0 && discount >= 0 && discount <= 100) {
      return (price * (1 - discount / 100)).toFixed(2);
    }
    return null;
  }, [formData.price, formData.discount]);

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? tr.editTitle : tr.addTitle}
          </h2>
          <button className="close-icon" onClick={closeModal}>×</button>
        </div>

        {/* BODY */}
        <div className="modal-body">
          <div className="form-group">
            <h3>{tr.mainInfo}</h3>

            <div className="row">
              <input
                name="name_ua"
                placeholder={tr.nameUa}
                value={formData.name_ua}
                onChange={handleChange}
                className="modal-input"
              />
              <input
                name="name_en"
                placeholder={tr.nameEn}
                value={formData.name_en}
                onChange={handleChange}
                className="modal-input"
              />
            </div>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="modal-input"
            >
              <option value="">{tr.selectCategory}</option>
              {categories.map((c) => (
                <option key={c._id} value={c.category}>
                  {c.names?.ua}
                </option>
              ))}
            </select>

            <div className="row price-row">
              <input
                name="price"
                type="number"
                placeholder={tr.price}
                value={formData.price}
                onChange={handleChange}
                className="modal-input"
              />
              <input
                name="discount"
                type="number"
                placeholder={tr.discount}
                value={formData.discount}
                onChange={handleChange}
                className="modal-input"
              />
            </div>

            {calculatedPrice && (
              <div className="discount-result-box">
                <FaCalculator />
                <span>
                  {tr.finalPrice}: <strong>{calculatedPrice} грн</strong>
                </span>
                {Number(formData.discount) > 0 && (
                  <span className="discount-applied">
                    <FaTag /> {formData.discount}%
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <h3>
              <FaImages /> {tr.media} ({MAX_IMAGES})
            </h3>

            <input
              name="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleChange}
              className="modal-input"
            />

            <label>{tr.model3d}</label>
            <input
              name="modelFile"
              type="file"
              accept=".glb"
              onChange={handleChange}
              className="modal-input"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="modal-buttons">
          <button className="cancel-btn" onClick={closeModal}>
            {tr.cancel}
          </button>
          <button className="submit-btn" onClick={handleAction}>
            {isEditing ? tr.save : tr.add}
          </button>
        </div>
      </div>
    </div>
  );
}
