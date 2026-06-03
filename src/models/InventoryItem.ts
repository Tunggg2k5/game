import mongoose, { Schema } from "mongoose";

const inventoryItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: { type: String, required: true, trim: true },
    stock: { type: Number, default: 0 },
    unit: { type: String, default: "cái", trim: true },
    reorderLevel: { type: Number, default: 10 },
    lastRequestedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, trim: true },
    active: { type: Boolean, default: true, index: true },
    demoKey: { type: String },
  },
  { timestamps: true },
);

export const InventoryItem =
  mongoose.models.InventoryItem ||
  mongoose.model("InventoryItem", inventoryItemSchema);
