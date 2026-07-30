type ExportBackupButtonProps = {
  onExport: () => void;
};

export default function ExportBackupButton({
  onExport,
}: ExportBackupButtonProps) {
  return (
    <button
      type="button"
      onClick={onExport}
      style={{
        padding: "10px 16px",

        borderRadius: 8,

        border: "none",

        background: "#16a34a",

        color: "#ffffff",

        cursor: "pointer",

        fontWeight: 600,
      }}
    >
      Export Backup File
    </button>
  );
}
