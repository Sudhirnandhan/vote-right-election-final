import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Must include letters and numbers"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});