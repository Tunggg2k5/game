import mongoose, { Schema } from "mongoose";

const workScheduleSchema = new Schema(
  {
    dentist: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    weekday: { type: Number, required: true, min: 0, max: 6, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotMinutes: { type: Number, default: 30 },
    room: { type: String, trim: true },
    active: { type: Boolean, default: true, index: true },
    demoKey: { type: String },
  },
  { timestamps: true },
);

workScheduleSchema.index({ dentist: 1, weekday: 1, startTime: 1 }, { unique: false });

export const WorkSchedule =
  mongoose.models.WorkSchedule || mongoose.model("WorkSchedule", workScheduleSchema);
