import { exportSecurityReport } from "../../utils/securityExporter";

type SecurityExportButtonProps = {
  format: "JSON" | "CSV";
};

export default function SecurityExportButton({
  format,
}: SecurityExportButtonProps) {
  function handleExport() {
    exportSecurityReport(format);
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
