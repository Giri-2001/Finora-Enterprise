import { exportAuditLogs } from "../../utils/auditExporter";

type AuditExportButtonProps = {
  format: "JSON" | "CSV";
};

export default function AuditExportButton({ format }: AuditExportButtonProps) {
  function handleExport() {
    exportAuditLogs(format);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      style={{
        background: "#2563eb",

        color: "#ffffff",

        border: "none",

        padding: "8px 14px",

        borderRadius: 6,

        cursor: "pointer",
      }}
    >
      Export {format}
    </button>
  );
}
