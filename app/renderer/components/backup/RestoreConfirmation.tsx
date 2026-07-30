type RestoreConfirmationProps = {
  onConfirm: () => void;

  onCancel: () => void;
};

export default function RestoreConfirmation({
  onConfirm,
  onCancel,
}: RestoreConfirmationProps) {
  return (
    <div
      style={{
        padding: 20,

        background: "#1e293b",

        borderRadius: 12,

        marginTop: 16,
      }}
    >
      <h3>Confirm Restore</h3>

      <p>Restoring this backup will replace current FINORA data.</p>

      <div
        style={{
          display: "flex",

          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onConfirm}
          style={{
            background: "#dc2626",

            color: "#ffffff",

            border: "none",

            padding: "8px 16px",

            borderRadius: 6,

            cursor: "pointer",
          }}
        >
          Confirm Restore
        </button>

        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "#475569",

            color: "#ffffff",

            border: "none",

            padding: "8px 16px",

            borderRadius: 6,

            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
