type ReceiptButtonProps = {
  onClick: () => void;
};

export default function ReceiptButton({ onClick }: ReceiptButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: "8px",
        border: "none",
        background: "#16a34a",
        color: "#ffffff",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      Print Receipt
    </button>
  );
}
