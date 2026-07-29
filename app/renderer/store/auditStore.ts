import type { AuditLog } from "../components/audit/types";

const STORAGE_KEY = "finora_audit_logs";

function loadLogs(): AuditLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data) as AuditLog[];
  } catch {
    return [];
  }
}

function saveLogs(logs: AuditLog[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

let logs: AuditLog[] = loadLogs();

export function getAuditLogs(): AuditLog[] {
  return [...logs];
}

export function addAuditLog(log: AuditLog): void {
  logs = [log, ...logs];

  saveLogs(logs);
}

export function createAuditLog(data: Omit<AuditLog, "id" | "createdAt">): void {
  const log: AuditLog = {
    id: Date.now().toString(),

    action: data.action,

    module: data.module,

    description: data.description,

    performedBy: data.performedBy,

    userRole: data.userRole,

    createdAt: new Date().toISOString(),
  };

  addAuditLog(log);
}

export function clearAuditLogs(): void {
  logs = [];

  saveLogs(logs);
}
