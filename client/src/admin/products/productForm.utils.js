export const prepareProductFormData = (data) => {
  const form = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined || (value === "" && key !== "manualLink")) return;

    if (key === "images" && Array.isArray(value)) {
      value.forEach(file => file instanceof File && form.append("images", file));
      return;
    }

    if (key === "modelFile" && value instanceof File) {
      form.append("modelFile", value);
      return;
    }

    if (["currentImages", "currentModel"].includes(key) && !data._id) return;

    if (key === "currentImages" || key === "currentModel") {
      form.append(key, JSON.stringify(value));
    } else {
      form.append(key, value);
    }
  });

  return form;
};
