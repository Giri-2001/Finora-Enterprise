type RestoreBackupButtonProps = {
  onRestore: (file: File) => void;
};

export default function RestoreBackupButton({
  onRestore,
}: RestoreBackupButtonProps) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    onRestore(file);
  }

  return (
    <label
      style={{
        display: "inline-block",

        padding: "10px 16px",

        borderRadius: 8,

        background: "#f59e0b",

        color: "#ffffff",

        cursor: "pointer",

        fontWeight: 600,
      }}
    >
      Restore Backup File
      <input
        type="file"
        accept=".json"
        onChange={handleChange}
        style={{
          display: "none",
        }}
      />
    </label>
  );
}
