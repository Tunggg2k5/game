import mongoose, { Schema } from "mongoose";

const treatmentRecordSchema = new Schema(
  {
    appointment: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
      index: true,
    },
    patient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dentist: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    nurse: { type: Schema.Types.ObjectId, ref: "User" },
    diagnosis: { type: String, trim: true },
    procedures: { type: String, trim: true },
    prescription: { type: String, trim: true },
    dentistNotes: { type: String, trim: true },
    nurseNotes: { type: String, trim: true },
    careInstructions: { type: String, trim: true },
    nextVisitDate: { type: Date },
    demoKey: { type: String },
  },
  { timestamps: true },
);

export const TreatmentRecord =
  mongoose.models.TreatmentRecord ||
  mongoose.model("TreatmentRecord", treatmentRecordSchema);
