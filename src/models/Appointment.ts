import mongoose, { Schema } from "mongoose";
import { appointmentStatuses } from "@/lib/types";

const appointmentSchema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dentist: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    nurse: { type: Schema.Types.ObjectId, ref: "User", index: true },
    service: {
      type: Schema.Types.ObjectId,
      ref: "DentalService",
      required: true,
      index: true,
    },
    appointmentDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: appointmentStatuses,
      default: "pending",
      index: true,
    },
    price: { type: Number, default: 0 },
    symptoms: { type: String, trim: true },
    notes: { type: String, trim: true },
    cancellationReason: { type: String, trim: true },
    noShowReason: { type: String, trim: true },
    rescheduledFrom: {
      appointmentDate: Date,
      startTime: String,
      endTime: String,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    confirmedBy: { type: Schema.Types.ObjectId, ref: "User" },
    checkInAt: { type: Date },
    noShowAt: { type: Date },
    completedAt: { type: Date },
    demoKey: { type: String },
  },
  { timestamps: true },
);

appointmentSchema.index({ dentist: 1, appointmentDate: 1, startTime: 1 });

export const Appointment =
  mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
