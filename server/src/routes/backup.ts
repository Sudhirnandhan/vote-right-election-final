import { Router } from "express";
import fs from "fs";
import { requireAuth, requireRole } from "../middleware/auth";
import { adminRateLimiter } from "../middleware/rateLimit";
import { enforceRetention, getBackupPath, listBackups, runBackup, restoreBackup } from "../services/backup";

const router = Router();

// List backups
router.get("/", requireAuth, requireRole("admin"), adminRateLimiter, (_req, res) => {
  const backups = listBackups();
  res.json({ backups });
});

// Trigger manual backup
router.post("/run", requireAuth, requireRole("admin"), adminRateLimiter, async (_req, res) => {
  try {
    const info = await runBackup();
    // Keep latest 7 by default
    enforceRetention(7);
    res.json({ message: "Backup completed", backup: info });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(500).json({ message: "Backup failed", error: message });
  }
});

// Download a backup file
router.get("/download/:filename", requireAuth, requireRole("admin"), adminRateLimiter, (req, res) => {
  const p = getBackupPath(req.params.filename);
  if (!fs.existsSync(p)) return res.status(404).json({ message: "Not found" });
  res.download(p);
});

// Restore from a backup
router.post("/restore/:filename", requireAuth, requireRole("admin"), adminRateLimiter, async (req, res) => {
  try {
    await restoreBackup(req.params.filename);
    res.json({ message: "Restore completed" });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(500).json({ message: "Restore failed", error: message });
  }
});

export default router;