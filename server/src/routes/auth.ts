import { Router } from "express";
import { registerSchema, loginSchema } from "../schema/auth";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const router = Router();

function signTokens(id: string, role: string) {
  const access = jwt.sign({ id, role }, env.jwtAccessSecret, { expiresIn: "15m" });
  const refresh = jwt.sign({ id, role }, env.jwtRefreshSecret, { expiresIn: "7d" });
  return { access, refresh };
}

router.post("/register", async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ errors: parse.error.flatten() });
  const { email, name, password } = parse.data;

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 12); // stronger cost factor
  const user = await User.create({ email, name, passwordHash, role: "pending" });
  return res.status(201).json({ message: "Registered. Await admin approval.", userId: user.id });
});

router.post("/login", async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ errors: parse.error.flatten() });
  const { email, password } = parse.data;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  if (user.role === "pending") {
    return res.status(403).json({ message: "Account pending approval" });
  }

  const { access, refresh } = signTokens(user.id, user.role);
  res.cookie("access_token", access, { httpOnly: true, sameSite: "lax", secure: env.cookieSecure, maxAge: 15 * 60 * 1000 });
  res.cookie("refresh_token", refresh, { httpOnly: true, sameSite: "lax", secure: env.cookieSecure, maxAge: 7 * 24 * 60 * 60 * 1000 });
  user.lastLogin = new Date();
  await user.save();
  return res.json({ message: "Logged in", role: user.role, name: user.name, email: user.email });
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refresh_token as string | undefined;
  if (!token) return res.status(401).json({ message: "No refresh token" });
  try {
    const payload = jwt.verify(token, env.jwtRefreshSecret) as { id: string; role: string };
    const { access } = signTokens(payload.id, payload.role);
    res.cookie("access_token", access, { httpOnly: true, sameSite: "lax", secure: env.cookieSecure, maxAge: 15 * 60 * 1000 });
    return res.json({ message: "Refreshed" });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

router.post("/logout", async (_req, res) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  return res.json({ message: "Logged out" });
});

export default router;