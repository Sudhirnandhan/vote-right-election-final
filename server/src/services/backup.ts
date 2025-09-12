import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { env } from "../config/env";

const execAsync = promisify(exec);

const BACKUP_DIR = path.resolve(process.cwd(), "backups");

export interface BackupInfo {
  filename: string;
  createdAt: string; // ISO string
  sizeBytes: number;
}

// Ensure backup directory exists
export function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

export async function runBackup(): Promise<BackupInfo> {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(BACKUP_DIR, `dump-${timestamp}`);

  // mongodump must be installed and on PATH
  const cmd = `mongodump --uri=\"${env.mongoUri}\" --out=\"${outDir}\"`;
  await execAsync(cmd);

  // Zip the dump folder to a single archive for retention/download
  const zipFile = path.join(BACKUP_DIR, `backup-${timestamp}.zip`);

  // Use PowerShell Compress-Archive for Windows environment
  const compressCmd = `powershell -NoProfile -Command \"Compress-Archive -Path '${outDir}/*' -DestinationPath '${zipFile}'\"`;
  await execAsync(compressCmd);

  // Remove raw folder after zip
  fs.rmSync(outDir, { recursive: true, force: true });

  const stat = fs.statSync(zipFile);
  return { filename: path.basename(zipFile), createdAt: new Date().toISOString(), sizeBytes: stat.size };
}

export function listBackups(): BackupInfo[] {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.zip'));
  return files.map((f) => {
    const p = path.join(BACKUP_DIR, f);
    const stat = fs.statSync(p);
    return { filename: f, createdAt: stat.mtime.toISOString(), sizeBytes: stat.size };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBackupPath(filename: string) {
  ensureBackupDir();
  return path.join(BACKUP_DIR, path.basename(filename));
}

export async function restoreBackup(zipFilename: string) {
  // Extract to temp, then run mongorestore
  ensureBackupDir();
  const zipPath = getBackupPath(zipFilename);
  if (!fs.existsSync(zipPath)) throw new Error("Backup file not found");

  const tempDir = path.join(BACKUP_DIR, `restore-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const extractCmd = `powershell -NoProfile -Command \"Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force\"`;
  await execAsync(extractCmd);

  // Find the dump folder inside tempDir
  const childDirs = fs.readdirSync(tempDir).map((n) => path.join(tempDir, n));
  const dumpDir = childDirs.find((p) => fs.lstatSync(p).isDirectory());
  if (!dumpDir) throw new Error("Dump folder not found inside archive");

  const restoreCmd = `mongorestore --uri=\"${env.mongoUri}\" \"${dumpDir}\" --drop`;
  await execAsync(restoreCmd);

  fs.rmSync(tempDir, { recursive: true, force: true });
}

export function enforceRetention(keep: number) {
  const backups = listBackups();
  if (backups.length <= keep) return;
  const remove = backups.slice(keep);
  for (const b of remove) {
    const p = getBackupPath(b.filename);
    if (fs.existsSync(p)) fs.rmSync(p);
  }
}