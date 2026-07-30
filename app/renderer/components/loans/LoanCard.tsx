import type { Loan } from "./types";

type LoanCardProps = {
  loan: Loan;
};

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function LoanCard({ loan }: LoanCardProps) {
  return (
    <div
      style={{
        padding: 20,

        borderRadius: 12,

        background: "#ffffff",

        border: "1px solid #e2e8f0",

        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <h3>{loan.finoraLoanId}</h3>

      <p>
        <strong>Customer:</strong> {loan.customerId}
      </p>

      <p>
        <strong>Approved:</strong> {formatCurrency(loan.approvedLoanAmount)}
      </p>

      <p>
        <strong>Balance:</strong> {formatCurrency(loan.outstandingAmount)}
      </p>

      <p>
        <strong>Collection:</strong> {loan.collectionType}
      </p>

      <p>
        <strong>Interest:</strong> {loan.interestValue} {loan.interestType}
      </p>

      <span
        style={{
          display: "inline-block",

          padding: "5px 12px",

          borderRadius: 20,

          background:
            loan.status === "Active"
              ? "#16a34a"
              : loan.status === "Closed"
                ? "#2563eb"
                : loan.status === "Default"
                  ? "#dc2626"
                  : "#ca8a04",

          color: "#ffffff",

          fontSize: 12,

          fontWeight: 600,
        }}
      >
        {loan.status}
      </span>
    </div>
  );
}
