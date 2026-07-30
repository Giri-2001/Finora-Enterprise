type BackupButtonProps = {
  onBackup: () => void;

  label?: string;
};

export default function BackupButton({
  onBackup,
  label = "Create Backup",
}: BackupButtonProps) {
  return (
    <button
      type="button"
      onClick={onBackup}
      style={{
        padding: "10px 16px",

        borderRadius: 8,

        border: "none",

        background: "#2563eb",

        color: "#ffffff",

        cursor: "pointer",

        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}
