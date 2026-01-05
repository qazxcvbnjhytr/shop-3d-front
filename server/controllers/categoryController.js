import Location from "../models/Location.js";

export const getLocations = async (req, res) => {
  try {
    const locations = await Location.find({});
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: "Помилка завантаження локацій" });
  }
};

// Метод для адмінки (додавання)
export const createLocation = async (req, res) => {
  try {
    const newLocation = new Location(req.body);
    const saved = await newLocation.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: "Помилка валідації" });
  }
};