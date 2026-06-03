import mongoose, { Schema } from "mongoose";

const nurseTaskSchema = new Schema(
  {
    nurse: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    appointment: { type: Schema.Types.ObjectId, ref: "Appointment", index: true },
    title: { type: String, required: true, trim: true },
    checklist: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["todo", "doing", "done"],
      default: "todo",
      index: true,
    },
    dueAt: { type: Date },
    notes: { type: String, trim: true },
    demoKey: { type: String },
  },
  { timestamps: true },
);

export const NurseTask =
  mongoose.models.NurseTask || mongoose.model("NurseTask", nurseTaskSchema);
