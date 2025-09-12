import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { env, validateEnv } from "./config/env";
import { connectDB } from "./db/connect";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import backupRoutes from "./routes/backup";
import healthRoutes from "./routes/health";
import electionsRoutes from "./routes/elections";
import { authRateLimiter, adminRateLimiter } from "./middleware/rateLimit";
import { enforceRetention } from "./services/backup";

async function bootstrap() {
  validateEnv();
  await connectDB();

  const app = express();
  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests from known origins (including undefined for tools like Postman)
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());

  // Health with DB status
  app.use("/health", healthRoutes);

  // Rate-limited auth routes
  app.use("/auth", authRateLimiter, authRoutes);

  // Elections routes (auth required)
  app.use("/elections", authRateLimiter, electionsRoutes);

  // Admin routes and backup routes with stricter limiter
  app.use("/admin", adminRateLimiter, adminRoutes);
  app.use("/backup", adminRateLimiter, backupRoutes);

  // Optional: scheduled backups with retention using setInterval
  if (env.backupEnabled) {
    const hours = Math.max(1, env.backupIntervalHours);
    const intervalMs = hours * 60 * 60 * 1000;
    setInterval(() => {
      import("./services/backup").then(async (svc) => {
        try {
          await svc.runBackup();
          enforceRetention(env.backupRetention);
          // eslint-disable-next-line no-console
          console.log(`[backup] Completed scheduled backup (keep ${env.backupRetention})`);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("[backup] Scheduled backup failed:", e);
        }
      });
    }, intervalMs);
    // eslint-disable-next-line no-console
    console.log(`[backup] Scheduling enabled: every ${hours}h, retention ${env.backupRetention}`);
  }

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});