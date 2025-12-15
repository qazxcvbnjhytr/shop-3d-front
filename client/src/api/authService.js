import api from "./api";

export const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data; // { token, user }
};

export const fetchUser = async () => {
  try {
    const res = await api.get("/auth/me");
    return res.data; // повертає дані користувача
  } catch (err) {
    console.error("Не вдалося отримати користувача:", err);
    throw err;
  }
};
