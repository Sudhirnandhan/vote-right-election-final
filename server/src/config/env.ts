import dotenv from "dotenv";

dotenv.config();

// Helper: parse comma-separated origins into an array, with sensible defaults for Vite
function parseCorsOrigins(input?: string): string[] {
  const defaults = ["http://localhost:8080", "http://127.0.0.1:8080"];
  if (!input || !input.trim()) return defaults;
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  port: parseInt(process.env.PORT || "4000", 10),
  mongoUri: process.env.MONGO_URI || "",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  cookieSecure: (process.env.COOKIE_SECURE || "false").toLowerCase() === "true",

  // Backups
  backupEnabled: (process.env.BACKUP_ENABLED || "true").toLowerCase() === "true",
  backupIntervalHours: parseInt(process.env.BACKUP_INTERVAL_HOURS || "24", 10),
  backupRetention: parseInt(process.env.BACKUP_RETENTION || "7", 10),
};

export function validateEnv() {
  const missing: string[] = [];
  if (!env.mongoUri) missing.push("MONGO_URI");
  if (!env.jwtAccessSecret) missing.push("JWT_ACCESS_SECRET");
  if (!env.jwtRefreshSecret) missing.push("JWT_REFRESH_SECRET");
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error("Missing environment variables:", missing.join(", "));
    process.exit(1);
  }
}