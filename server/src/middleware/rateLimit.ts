import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";

// NOTE: We cast to Express v4 RequestHandler to avoid type clashes between
// differing @types/express versions in the monorepo (root vs server).
// This is safe at runtime as express-rate-limit returns a compatible handler.

// Basic rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
}) as unknown as RequestHandler;

// Stricter limiter for admin endpoints
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
}) as unknown as RequestHandler;