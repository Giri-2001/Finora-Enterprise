import { getAuditLogs } from "../store/auditStore";

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

export function exportAuditLogs(format: ExportFormat): void {
  const logs = getAuditLogs();

  const timestamp = Date.now();

  if (format === "JSON") {
    downloadFile(
      JSON.stringify(logs, null, 2),

      `FINORA_AUDIT_LOGS_${timestamp}.json`,

      "application/json",
    );

    return;
  }

  const header = "Action,Module,Description,Performed By,Role,Date\n";

  const rows = logs.map((log) =>
    [
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
    header + rows.join("\n"),

    `FINORA_AUDIT_LOGS_${timestamp}.csv`,

    "text/csv",
  );
}
