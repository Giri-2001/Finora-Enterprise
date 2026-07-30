import type { LoanStatus } from "./types";

type LoanStatusBadgeProps = {
  status: LoanStatus;
};

function getStatusColor(status: LoanStatus): string {
  switch (status) {
    case "Active":
      return "var(--success)";
    case "Closed":
      return "var(--finora-accent)";
    case "Pending":
      return "var(--warning)";
    case "Default":
      return "var(--danger)";
    default:
      return "var(--text-muted)";
  }
}

export default function LoanStatusBadge({ status }: LoanStatusBadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 90,
        padding: "6px 14px",
        borderRadius: 999,
        background: getStatusColor(status),
        color: "#ffffff",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0.3,
        userSelect: "none",
      }}
    >
      {status}
    </span>
  );
}
