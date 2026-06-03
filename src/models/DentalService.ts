import mongoose, { Schema } from "mongoose";

const dentalServiceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    durationMinutes: { type: Number, default: 30, min: 15 },
    price: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true, index: true },
    demoKey: { type: String },
  },
  { timestamps: true },
);

export const DentalService =
  mongoose.models.DentalService ||
  mongoose.model("DentalService", dentalServiceSchema);
