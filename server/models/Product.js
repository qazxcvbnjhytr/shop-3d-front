import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    ua: { type: String, required: true },
    en: { type: String, required: true },
  },
  category: { type: String, required: true },
  typeKey: String,
images: {
        type: [String], // Масив шляхів до файлів
        default: [],
    },
  modelUrl: String,
  specifications: {
    width: Number,
    height: Number,
    depth: Number,
    weight: Number,
    bedSize: String,
    materialKey: String,
    manufacturerKey: String,
    warranty: Number,
    manualLink: String,
  },
price: {
        type: Number,
        required: true, 
        min: 0
    },
discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100 
    },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
