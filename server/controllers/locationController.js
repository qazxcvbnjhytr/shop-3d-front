import Location from "../models/Location.js"; // Обов'язково .js!

export const getLocations = async (req, res) => {
  try {
    const locations = await Location.find({ isActive: true }).sort({ city: 1 });
    res.status(200).json(locations);
  } catch (error) {
    console.error("❌ Помилка в getLocations:", error.message);
    res.status(500).json({ message: "Помилка сервера при отриманні локацій" });
  }
};

export const createLocation = async (req, res) => {
  try {
    const newLoc = new Location(req.body);
    await newLoc.save();
    res.status(201).json(newLoc);
  } catch (error) {
    console.error("❌ Помилка в createLocation:", error.message);
    res.status(400).json({ message: error.message });
  }
};