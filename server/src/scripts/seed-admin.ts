import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env, validateEnv } from "../config/env";
import { connectDB } from "../db/connect";
import { User } from "../models/User";

async function run() {
  validateEnv();
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL || "admin@voteright.local";
  const name = process.env.SEED_ADMIN_NAME || "Super Admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin1234";

  const existing = await User.findOne({ email });
  if (existing) {
    const reset = (process.env.SEED_ADMIN_RESET || "false").toLowerCase() === "true";
    if (reset) {
      const passwordHash = await bcrypt.hash(password, 10);
      existing.passwordHash = passwordHash;
      existing.role = "admin";
      existing.name = name;
      await existing.save();
      console.log("Admin password reset:", email);
    } else {
      console.log("Admin already exists:", email);
    }
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ email, name, passwordHash, role: "admin" });
  console.log("Seeded admin:", email);
  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});