type ReceiptButtonProps = {
  onClick: () => void;
};

export default function ReceiptButton({ onClick }: ReceiptButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "9px 16px",

        borderRadius: 10,

        border: "1px solid var(--success)",

        background: "linear-gradient(135deg,var(--success),#15803d)",

        color: "#ffffff",

        cursor: "pointer",

        fontWeight: 800,

        fontSize: 13,

        letterSpacing: "0.2px",

        boxShadow: "0 6px 18px rgba(34,197,94,0.25)",

        transition: "all .25s ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";

        event.currentTarget.style.boxShadow =
          "0 12px 28px rgba(34,197,94,0.35)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";

        event.currentTarget.style.boxShadow = "0 6px 18px rgba(34,197,94,0.25)";
      }}
    >
      Print Receipt
    </button>
  );
}
