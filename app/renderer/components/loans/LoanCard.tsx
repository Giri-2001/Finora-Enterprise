import type { Loan } from "./types";

type LoanCardProps = {
  loan: Loan;
};

function safeNumber(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatCurrency(value?: number) {
  return `₹${safeNumber(value).toLocaleString("en-IN")}`;
}

function getStatusColor(status: Loan["status"]) {
  switch (status) {
    case "Active":
      return "var(--success)";

    case "Closed":
      return "var(--finora-accent)";

    case "Default":
      return "var(--danger)";

    default:
      return "var(--warning)";
  }
}

export default function LoanCard({ loan }: LoanCardProps) {
  return (
    <div
      style={{
        padding: 24,

        borderRadius: 18,

        background: "var(--surface)",

        border: "1px solid var(--surface-border)",

        boxShadow: "var(--card-shadow)",

        color: "var(--text)",

        transition: "all .25s ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          marginBottom: 18,
        }}
      >
        <h3
          style={{
            margin: 0,

            color: "var(--finora-accent)",

            fontWeight: 900,

            fontSize: 20,
          }}
        >
          {loan.finoraLoanId}
        </h3>

        <span
          style={{
            padding: "6px 14px",

            borderRadius: 30,

            background: getStatusColor(loan.status),

            color: "#ffffff",

            fontSize: 12,

            fontWeight: 800,
          }}
        >
          {loan.status}
        </span>
      </div>

      <div
        style={{
          display: "flex",

          flexDirection: "column",

          gap: 12,

          color: "var(--text)",
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>Customer:</strong> {loan.customerId || "N/A"}
        </p>

        <p style={{ margin: 0 }}>
          <strong>Approved:</strong> {formatCurrency(loan.approvedLoanAmount)}
        </p>

        <p style={{ margin: 0 }}>
          <strong>Balance:</strong> {formatCurrency(loan.outstandingAmount)}
        </p>

        <p style={{ margin: 0 }}>
          <strong>Collection:</strong> {loan.collectionType || "N/A"}
        </p>

        <p style={{ margin: 0 }}>
          <strong>Interest:</strong> {safeNumber(loan.interestValue)}{" "}
          {loan.interestType}
        </p>

        <p style={{ margin: 0 }}>
          <strong>Duration:</strong> {safeNumber(loan.duration)} Months
        </p>
      </div>
    </div>
  );
}
