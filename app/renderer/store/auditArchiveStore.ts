import type { AuditLog } from "../components/audit/types";

import { getAuditLogs } from "./auditStore";

const STORAGE_KEY = "finora_audit_archives";

export type AuditArchive = {
  id: string;

  name: string;

  totalLogs: number;

  createdAt: string;

  createdBy: string;

  logs: AuditLog[];
};

function loadArchives(): AuditArchive[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as AuditArchive[];
  } catch {
    return [];
  }
}

function saveArchives(archives: AuditArchive[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(archives));
}

let archives: AuditArchive[] = loadArchives();

export function getAuditArchives(): AuditArchive[] {
  return [...archives];
}

export function createAuditArchive(createdBy: string, name?: string): void {
  const logs = getAuditLogs();

  const archive: AuditArchive = {
    id: Date.now().toString(),

    name: name ?? `FINORA_AUDIT_ARCHIVE_${Date.now()}`,

    totalLogs: logs.length,

    createdAt: new Date().toISOString(),

    createdBy,

    logs,
  };

  archives = [archive, ...archives];

  saveArchives(archives);
}

export function restoreAuditArchive(id: string): AuditLog[] | null {
  const archive = archives.find((item) => item.id === id);

  if (!archive) {
    return null;
  }

  return [...archive.logs];
}

export function deleteAuditArchive(id: string): void {
  archives = archives.filter((archive) => archive.id !== id);

  saveArchives(archives);
}

export function clearAuditArchives(): void {
  archives = [];

  saveArchives(archives);
}
