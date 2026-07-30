import { getAuditLogs } from "../store/auditStore";

import { getLoginSecurityRecords } from "../store/loginSecurityStore";

type ExportFormat = "JSON" | "CSV";

function downloadFile(content: string, fileName: string, type: string): void {
  const blob = new Blob([content], {
    type,
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = fileName;

  link.click();

  URL.revokeObjectURL(url);
}

function getSecurityReportData() {
  const securityRecords = getLoginSecurityRecords();

  const auditLogs = getAuditLogs().filter(
    (log) => log.module === "AUTH" || log.module === "SYSTEM",
  );

  return {
    generatedAt: new Date().toISOString(),

    securityRecords,

    auditLogs,
  };
}

export function exportSecurityReport(format: ExportFormat): void {
  const data = getSecurityReportData();

  const timestamp = Date.now();

  if (format === "JSON") {
    downloadFile(
      JSON.stringify(data, null, 2),

      `FINORA_SECURITY_REPORT_${timestamp}.json`,

      "application/json",
    );

    return;
  }

  const csvHeader = "Type,Action,Module,Description,User,Role,Date\n";

  const csvRows = data.auditLogs.map((log) =>
    [
      "AUDIT",

      log.action,

      log.module,

      log.description,

      log.performedBy,

      log.userRole,

      log.createdAt,
    ]
      .map((value) => `"${value}"`)
      .join(","),
  );

  downloadFile(
    csvHeader + csvRows.join("\n"),

    `FINORA_SECURITY_REPORT_${timestamp}.csv`,

    "text/csv",
  );
}
