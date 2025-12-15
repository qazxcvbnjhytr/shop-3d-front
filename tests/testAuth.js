// seedBeds.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/productModel.js"; // шлях до твоєї моделі Product

dotenv.config();

const beds = [
  {
    name: { ua: "Luxury Rest", en: "Luxury Rest" },
    category: "beds",
    image: "/img/catalog/beds/bed10.jpg",
    model: "/models/bed10.glb",
    specifications: {
      width: 153.4,
      height: 98.7,
      depth: 211.4,
      weight: 125,
      typeKey: "bed",
      bedSize: "140x200",
      materialKey: "ldsp",
      manufacturerKey: "centerLine",
      warranty: 18,
      manualLink: "/manuals/bed10.pdf",
      price: 14500
    }
  },
  {
    name: { ua: "Cozy Dream", en: "Cozy Dream" },
    category: "beds",
    image: "/img/catalog/beds/bed11.jpg",
    model: "/models/bed11.glb",
    specifications: {
      width: 160,
      height: 95,
      depth: 210,
      weight: 130,
      typeKey: "bed",
      bedSize: "160x200",
      materialKey: "oak",
      manufacturerKey: "DreamLine",
      warranty: 24,
      manualLink: "/manuals/bed11.pdf",
      price: 17800
    }
  }
];

const seedBeds = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    await Product.deleteMany({ category: "beds" }); // очищаємо старі ліжка
    await Product.insertMany(beds);

    console.log("Beds seeded successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedBeds();
