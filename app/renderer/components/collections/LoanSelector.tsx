import type { CSSProperties } from "react";

import type { Loan } from "../loans/types";

type LoanSelectorProps = {
  loans: Loan[];
  selectedLoanId: string;
  onSelect: (loanId: string) => void;
};

function formatCurrency(value?: number): string {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`;
}

export default function LoanSelector({
  loans,
  selectedLoanId,
  onSelect,
}: LoanSelectorProps) {
  const activeLoans = loans.filter((loan) => loan.status === "Active");

  const selectStyle: CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid var(--input-border)",
    background: "var(--input-bg)",
    color: "var(--text)",
    fontSize: 14,
    fontWeight: 600,
    outline: "none",
    cursor: "pointer",
    transition: "all .25s ease",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <label
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "var(--text-muted)",
        }}
      >
        Select Active Loan
      </label>

      <select
        value={selectedLoanId}
        onChange={(event) => onSelect(event.target.value)}
        style={selectStyle}
      >
        <option value="">Select Active Loan</option>

        {activeLoans.length === 0 ? (
          <option disabled>No active loans available</option>
        ) : (
          activeLoans.map((loan) => (
            <option key={loan.id} value={loan.id.toString()}>
              {loan.finoraLoanId} • {formatCurrency(loan.approvedLoanAmount)} •{" "}
              {loan.collectionType}
            </option>
          ))
        )}
      </select>

      <div
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        {activeLoans.length} active loan
        {activeLoans.length === 1 ? "" : "s"} available.
      </div>
    </div>
  );
}
