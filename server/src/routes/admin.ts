import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { FilterQuery } from "mongoose";
import type { IUser, UserRole } from "../models/User";

const router = Router();

router.get("/pending-users", requireAuth, requireRole("admin"), async (req, res) => {
  const orgId = req.user?.organizationId;
  const filter: FilterQuery<IUser> = { role: "pending" };
  if (orgId) filter.organizationId = orgId;
  const users = await User.find(filter).select("name email createdAt organizationId");
  res.json(users);
});

router.post("/approve/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { role, organizationId, classLevel, isEligible } = req.body as { role: "admin" | "manager" | "voter"; organizationId?: string; classLevel?: "11" | "12"; isEligible?: boolean };
  if (!role) return res.status(400).json({ message: "Role required" });
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role !== "pending") return res.status(400).json({ message: "User is not pending" });

  // Scope: admins without org are super-admins; else enforce same org
  const adminOrg = req.user?.organizationId;
  if (adminOrg && user.organizationId && user.organizationId !== adminOrg) {
    return res.status(403).json({ message: "Cannot approve user from another organization" });
  }

  user.role = role;
  if (organizationId) user.organizationId = organizationId;
  if (classLevel) user.classLevel = classLevel;
  if (typeof isEligible === "boolean") user.isEligible = isEligible;
  await user.save();
  res.json({ message: "User approved", id: user.id, role: user.role, organizationId: user.organizationId, classLevel: user.classLevel, isEligible: user.isEligible });
});

router.post("/reject/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  res.json({ message: "User rejected and deleted" });
});

// List all users with optional filters
router.get("/users", requireAuth, requireRole("admin"), async (req, res) => {
  const role = (req.query.role as string | undefined)?.toLowerCase() as UserRole | undefined;
  const classLevel = (req.query.classLevel as string | undefined) as "11" | "12" | undefined;
  const eligible = req.query.isEligible as string | undefined;

  const query: FilterQuery<IUser> = {};
  const orgId = req.user?.organizationId;
  if (orgId) query.organizationId = orgId;

  if (role && ["admin", "manager", "voter", "pending"].includes(role)) query.role = role;
  if (classLevel && ["11", "12"].includes(classLevel)) query.classLevel = classLevel;
  if (eligible === "true" || eligible === "false") query.isEligible = eligible === "true";

  const users = await User.find(query).select("name email role lastLogin createdAt organizationId classLevel isEligible");
  res.json(users);
});

// Create user directly by admin (persists to DB)
router.post("/users", requireAuth, requireRole("admin"), async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    role: z.enum(["admin", "manager", "voter"]).default("voter"),
    password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Must include letters and numbers"),
    organizationId: z.string().trim().optional(),
    classLevel: z.enum(["11", "12"]).optional(),
    isEligible: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const { name, email, role, password } = parsed.data;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 12);
  const organizationId = parsed.data.organizationId ?? req.user?.organizationId; // default to admin's org
  const user = await User.create({ name, email, role, passwordHash, organizationId, classLevel: parsed.data.classLevel, isEligible: parsed.data.isEligible ?? false });
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId, classLevel: user.classLevel, isEligible: user.isEligible });
});

// Update a user's fields
router.patch("/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(100).optional(),
    role: z.enum(["admin", "manager", "voter", "pending"]).optional(),
    password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Must include letters and numbers").optional(),
    organizationId: z.string().trim().optional(),
    classLevel: z.enum(["11", "12"]).optional(),
    isEligible: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // org scoping: if admin has org, disallow changing other org users
  const adminOrg = req.user?.organizationId;
  if (adminOrg && user.organizationId && user.organizationId !== adminOrg) {
    return res.status(403).json({ message: "Cannot modify user from another organization" });
  }

  const { name, role, password, organizationId, classLevel, isEligible } = parsed.data;
  if (name) user.name = name;
  if (role) user.role = role;
  if (password) user.passwordHash = await bcrypt.hash(password, 12);
  if (organizationId) user.organizationId = organizationId;
  if (classLevel) user.classLevel = classLevel;
  if (typeof isEligible === "boolean") user.isEligible = isEligible;

  await user.save();
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId, classLevel: user.classLevel, isEligible: user.isEligible });
});

// Delete user
router.delete("/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  res.json({ message: "User deleted" });
});

export default router;