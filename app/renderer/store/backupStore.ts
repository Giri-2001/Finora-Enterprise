import type { BackupRecord } from "../components/backup/types";

const STORAGE_KEY = "finora_backups";

function loadBackups(): BackupRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as BackupRecord[];
  } catch {
    return [];
  }
}

function saveBackups(backups: BackupRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(backups));
}

let backups: BackupRecord[] = loadBackups();

export function getBackups(): BackupRecord[] {
  return [...backups];
}

export function createBackup(backup: BackupRecord): void {
  backups = [backup, ...backups];

  saveBackups(backups);
}

export function restoreBackup(id: string): void {
  backups = backups.map((backup) =>
    backup.id === id
      ? {
          ...backup,

          status: "RESTORED",
        }
      : backup,
  );

  saveBackups(backups);
}

export function deleteBackup(id: string): void {
  backups = backups.filter((backup) => backup.id !== id);

  saveBackups(backups);
}

export function clearBackups(): void {
  backups = [];

  saveBackups(backups);
}
