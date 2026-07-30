import { clearAuditLogs, getAuditLogs } from "../store/auditStore";

import { createAuditArchive } from "../store/auditArchiveStore";

import { getAuditRetentionConfig } from "../store/auditRetentionStore";

import { createAuditLog } from "../store/auditStore";

export function runAuditRetentionEngine(): void {
  const config = getAuditRetentionConfig();

  if (!config.cleanupEnabled && !config.autoArchiveEnabled) {
    return;
  }

  const logs = getAuditLogs();

  if (logs.length === 0) {
    return;
  }

  const cutoffDate = new Date();

  cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

  const oldLogs = logs.filter((log) => new Date(log.createdAt) < cutoffDate);

  if (oldLogs.length === 0) {
    return;
  }

  if (config.autoArchiveEnabled) {
    createAuditArchive("SYSTEM", `AUTO_AUDIT_ARCHIVE_${Date.now()}`);

    createAuditLog({
      action: "CREATE",

      module: "SYSTEM",

      description: `Automatic audit archive created for ${oldLogs.length} old records`,

      performedBy: "SYSTEM",

      userRole: "SYSTEM",
    });
  }

  if (config.cleanupEnabled) {
    clearAuditLogs();

    createAuditLog({
      action: "DELETE",

      module: "SYSTEM",

      description: `Audit retention cleanup removed ${oldLogs.length} records`,

      performedBy: "SYSTEM",

      userRole: "SYSTEM",
    });
  }
}
