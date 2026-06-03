import mongoose, { Schema } from "mongoose";

const vitalSignSchema = new Schema(
  {
    appointment: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
      index: true,
    },
    patient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    nurse: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bloodPressure: { type: String, trim: true },
    pulse: { type: Number },
    temperature: { type: Number },
    weight: { type: Number },
    allergies: { type: String, trim: true },
    chiefComplaint: { type: String, trim: true },
    demoKey: { type: String },
  },
  { timestamps: true },
);

export const VitalSign =
  mongoose.models.VitalSign || mongoose.model("VitalSign", vitalSignSchema);
