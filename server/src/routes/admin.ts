import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

const router = Router();

router.get("/pending-users", requireAuth, requireRole("admin"), async (_req, res) => {
  const users = await User.find({ role: "pending" }).select("name email createdAt");
  res.json(users);
});

router.post("/approve/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body as { role: "admin" | "manager" | "voter" };
  if (!role) return res.status(400).json({ message: "Role required" });
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role !== "pending") return res.status(400).json({ message: "User is not pending" });
  user.role = role;
  await user.save();
  res.json({ message: "User approved", id: user.id, role: user.role });
});

router.post("/reject/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  res.json({ message: "User rejected and deleted" });
});

// List all users with optional role filter
router.get("/users", requireAuth, requireRole("admin"), async (req, res) => {
  const role = (req.query.role as string | undefined)?.toLowerCase();
  const query: any = {};
  if (role && ["admin", "manager", "voter", "pending"].includes(role)) query.role = role;
  const users = await User.find(query).select("name email role lastLogin createdAt");
  res.json(users);
});

// Create user directly by admin (persists to DB)
router.post("/users", requireAuth, requireRole("admin"), async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    role: z.enum(["admin", "manager", "voter"]).default("voter"),
    password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Must include letters and numbers"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const { name, email, role, password } = parsed.data;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, role, passwordHash });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// Update a user's role or name
router.patch("/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(100).optional(),
    role: z.enum(["admin", "manager", "voter", "pending"]).optional(),
    password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Must include letters and numbers").optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const { name, role, password } = parsed.data;
  if (name) user.name = name;
  if (role) user.role = role;
  if (password) user.passwordHash = await bcrypt.hash(password, 12);

  await user.save();
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

// Delete user
router.delete("/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  res.json({ message: "User deleted" });
});

export default router;