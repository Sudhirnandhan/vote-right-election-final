import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "admin" | "manager" | "voter" | "pending";

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole; // "pending" until approved
  organizationId?: string; // tenant scope; undefined implies system-level admin
  classLevel?: "11" | "12"; // grade/year for voters
  isEligible?: boolean; // whether the user is eligible to vote
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager", "voter", "pending"], default: "pending", index: true },
    organizationId: { type: String, index: true },
    classLevel: { type: String, enum: ["11", "12"], index: true },
    isEligible: { type: Boolean, default: false, index: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);