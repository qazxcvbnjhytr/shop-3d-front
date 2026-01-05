import mongoose from "mongoose";

const SectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: {
      ua: { type: String, required: true },
      en: { type: String, required: true },
    },
    fieldKeys: { type: [String], default: [] },
  },
  { _id: false }
);

const SpecTemplateSchema = new mongoose.Schema(
  {
    typeKey: { type: String, required: true, unique: true, index: true },
    title: {
      ua: { type: String, required: true },
      en: { type: String, required: true },
    },
    sections: { type: [SectionSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("SpecTemplate", SpecTemplateSchema);
