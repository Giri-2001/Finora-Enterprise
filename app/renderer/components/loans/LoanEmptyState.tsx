import Button from "../ui/Button";

type LoanEmptyStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function LoanEmptyState({
  title = "No Loans Found",
  message = "There are no loan records available. Create a new loan to get started.",
  actionLabel = "Create Loan",
  onAction,
}: LoanEmptyStateProps) {
  return (
    <div
      style={{
        padding: "56px 24px",
        borderRadius: 20,
        border: "1px dashed var(--surface-border)",
        background: "var(--surface)",
        boxShadow: "var(--card-shadow)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 48,
          marginBottom: 16,
        }}
      >
        📄
      </div>

      <h2
        style={{
          margin: 0,
          color: "var(--text)",
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: "12px auto 28px",
          maxWidth: 480,
          color: "var(--text-muted)",
          lineHeight: 1.6,
        }}
      >
        {message}
      </p>

      {onAction && (
        <Button type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
