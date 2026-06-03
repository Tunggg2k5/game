import mongoose, { Schema } from "mongoose";
import { roles } from "@/lib/types";

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: roles, required: true, index: true },
    avatarUrl: { type: String, trim: true },
    address: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
    specialty: { type: String, trim: true },
    experienceYears: { type: Number, default: 0 },
    licenseNo: { type: String, trim: true },
    bio: { type: String, trim: true },
    active: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date },
    demoKey: { type: String },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, active: 1 });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
