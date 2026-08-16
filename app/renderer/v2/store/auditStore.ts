// ============================================================
// FINORA ENTERPRISE OS™
//
// AUDIT STORE
//
// RESPONSIBILITY:
//
// - Manage FINORA audit logs
// - Persist audit logs
// - Create audit log records
// - Replace audit logs
// - Clear audit logs
//
// IMPORTANT:
//
// - Existing audit behavior is preserved.
// - Existing storage key is preserved.
// - No authentication logic.
// - No customer business logic.
// - No loan business logic.
// - No collection business logic.
//
// VERSION : 2.1
// STATUS  : Production Foundation
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  AuditLog,
} from "../components/audit/types";

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_KEY =
  "finora_audit_logs";

// ============================================================
// LOAD LOGS
// ============================================================

function loadLogs(): AuditLog[] {

  try {

    const data =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!data) {

      return [];

    }

    return JSON.parse(
      data,
    ) as AuditLog[];

  } catch {

    return [];

  }
}

// ============================================================
// SAVE LOGS
// ============================================================

function saveLogs(
  logs: AuditLog[],
): void {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      logs,
    ),
  );
}

// ============================================================
// IN-MEMORY AUDIT LOG CACHE
// ============================================================

let logs: AuditLog[] =
  loadLogs();

// ============================================================
// GET AUDIT LOGS
// ============================================================

export function getAuditLogs():
  AuditLog[] {

  return [
    ...logs,
  ];
}

// ============================================================
// ADD AUDIT LOG
// ============================================================

export function addAuditLog(
  log: AuditLog,
): void {

  logs = [
    log,
    ...logs,
  ];

  saveLogs(
    logs,
  );
}

// ============================================================
// CREATE AUDIT LOG
// ============================================================

export function createAuditLog(
  data: Omit<
    AuditLog,
    "id" | "createdAt"
  >,
): void {

  const log: AuditLog = {

    id:
      Date.now().toString(),

    action:
      data.action,

    module:
      data.module,

    description:
      data.description,

    performedBy:
      data.performedBy,

    userRole:
      data.userRole,

    createdAt:
      new Date().toISOString(),

  };

  addAuditLog(
    log,
  );
}

// ============================================================
// REPLACE AUDIT LOGS
// ============================================================

export function replaceAuditLogs(
  updatedLogs: AuditLog[],
): void {

  logs = [
    ...updatedLogs,
  ];

  saveLogs(
    logs,
  );
}

// ============================================================
// CLEAR AUDIT LOGS
// ============================================================

export function clearAuditLogs():
  void {

  logs = [];

  saveLogs(
    logs,
  );
}

// ============================================================
// END
// ============================================================