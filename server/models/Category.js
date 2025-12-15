import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    names: {
      type: new mongoose.Schema(
        {
          ua: { type: String, required: true },
          en: { type: String, required: true },
        },
        { _id: false }
      ),
      required: true,
    },
    category: { type: String, required: true, unique: true },
    image: { type: String, default: "" }, // шлях до картинки
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
