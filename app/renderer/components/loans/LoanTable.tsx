import type { CSSProperties } from "react";

import Button from "../ui/Button";
import type { Loan } from "./types";

type LoanTableProps = {
  loans: Loan[];
  onView: (loan: Loan) => void;
  onEdit: (loan: Loan) => void;
  onCloseLoan: (loan: Loan) => void;
};

function safeNumber(value?: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatCurrency(value?: number): string {
  return `₹${safeNumber(value).toLocaleString("en-IN")}`;
}

function getStatusColor(status: Loan["status"]): string {
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

export default function LoanTable({
  loans,
  onView,
  onEdit,
  onCloseLoan,
}: LoanTableProps) {
  if (loans.length === 0) {
    return (
      <div
        style={{
          marginTop: 20,
          padding: 48,
          borderRadius: 18,
          background: "var(--surface)",
          border: "1px dashed var(--surface-border)",
          color: "var(--text-muted)",
          textAlign: "center",
          fontWeight: 700,
          boxShadow: "var(--card-shadow)",
        }}
      >
        No loans available.
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 20,
        overflowX: "auto",
        borderRadius: 18,
        border: "1px solid var(--surface-border)",
        boxShadow: "var(--card-shadow)",
        background: "var(--surface)",
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: 1600,
          borderCollapse: "collapse",
          color: "var(--text)",
        }}
      >
        <thead>
          <tr
            style={{
              background: "var(--surface-hover)",
            }}
          >
            <th style={headerStyle}>FINORA ID</th>
            <th style={headerStyle}>Customer</th>
            <th style={headerStyle}>Approved</th>
            <th style={headerStyle}>Received</th>
            <th style={headerStyle}>Balance</th>
            <th style={headerStyle}>Interest</th>
            <th style={headerStyle}>Collection</th>
            <th style={headerStyle}>Status</th>
            <th style={headerStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {loans.map((loan, index) => (
            <tr
              key={loan.id}
              style={{
                background:
                  index % 2 === 0 ? "var(--surface)" : "var(--surface-hover)",
                borderBottom: "1px solid var(--surface-border)",
                transition: "background 0.2s ease",
              }}
            >
              <td style={cellStyle}>{loan.finoraLoanId}</td>
              <td style={cellStyle}>{loan.customerId || "N/A"}</td>

              <td style={moneyStyle}>
                {formatCurrency(loan.approvedLoanAmount)}
              </td>

              <td style={moneyStyle}>{formatCurrency(loan.receivedAmount)}</td>

              <td style={moneyStyle}>
                {formatCurrency(loan.outstandingAmount)}
              </td>

              <td style={cellStyle}>
                {safeNumber(loan.interestValue)} {loan.interestType}
              </td>

              <td style={cellStyle}>{loan.collectionType}</td>

              <td style={cellStyle}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 90,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: getStatusColor(loan.status),
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {loan.status}
                </span>
              </td>

              <td style={cellStyle}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    type="button"
                    size="small"
                    onClick={() => onView(loan)}
                  >
                    View
                  </Button>

                  <Button
                    type="button"
                    size="small"
                    variant="secondary"
                    onClick={() => onEdit(loan)}
                  >
                    Edit
                  </Button>

                  <Button
                    type="button"
                    size="small"
                    variant="danger"
                    onClick={() => onCloseLoan(loan)}
                  >
                    Close
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const headerStyle: CSSProperties = {
  padding: "14px",
  textAlign: "left",
  fontWeight: 800,
  fontSize: 13,
  whiteSpace: "nowrap",
  color: "var(--text)",
  position: "sticky",
  top: 0,
  background: "var(--surface-hover)",
};

const cellStyle: CSSProperties = {
  padding: "14px",
  fontSize: 14,
  color: "var(--text)",
  whiteSpace: "nowrap",
};

const moneyStyle: CSSProperties = {
  ...cellStyle,
  textAlign: "right",
  fontWeight: 700,
};
