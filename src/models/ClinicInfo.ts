import mongoose, { Schema } from "mongoose";

const clinicInfoSchema = new Schema(
  {
    name: { type: String, required: true, default: "DAS Dental Clinic" },
    slogan: { type: String, default: "Nụ cười khỏe, lịch hẹn gọn." },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true },
    openingHours: { type: String, trim: true },
    coverImageUrl: { type: String, trim: true },
    notes: { type: String, trim: true },
    demoKey: { type: String },
  },
  { timestamps: true },
);

export const ClinicInfo =
  mongoose.models.ClinicInfo || mongoose.model("ClinicInfo", clinicInfoSchema);
