import Button from "../ui/Button";

import type { Loan } from "./types";

type LoanTableProps = {
  loans: Loan[];

  onView: (loan: Loan) => void;

  onEdit: (loan: Loan) => void;

  onCloseLoan: (loan: Loan) => void;
};

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function getStatusColor(status: string) {
  switch (status) {
    case "Active":
      return "#16a34a";

    case "Closed":
      return "#2563eb";

    case "Pending":
      return "#ca8a04";

    case "Default":
      return "#dc2626";

    default:
      return "#6b7280";
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

          padding: 30,

          borderRadius: 12,

          background: "#1e293b",

          color: "#ffffff",

          textAlign: "center",

          fontWeight: 600,
        }}
      >
        No loans available.
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: "auto",

        marginTop: 20,
      }}
    >
      <table
        style={{
          width: "100%",

          borderCollapse: "collapse",

          minWidth: 1800,

          background: "#ffffff",
        }}
      >
        <thead
          style={{
            background: "#0f172a",

            color: "#ffffff",
          }}
        >
          <tr>
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
          {loans.map((loan) => (
            <tr
              key={loan.id}
              style={{
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <td style={cellStyle}>{loan.finoraLoanId}</td>

              <td style={cellStyle}>{loan.customerId}</td>

              <td style={moneyStyle}>
                {formatCurrency(loan.approvedLoanAmount)}
              </td>

              <td style={moneyStyle}>{formatCurrency(loan.receivedAmount)}</td>

              <td style={moneyStyle}>
                {formatCurrency(loan.outstandingAmount)}
              </td>

              <td style={cellStyle}>
                {loan.interestValue} {loan.interestType}
              </td>

              <td style={cellStyle}>{loan.collectionType}</td>

              <td style={cellStyle}>
                <span
                  style={{
                    background: getStatusColor(loan.status),

                    color: "#ffffff",

                    padding: "4px 10px",

                    borderRadius: 20,

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
                  }}
                >
                  <Button type="button" onClick={() => onView(loan)}>
                    View
                  </Button>

                  <Button type="button" onClick={() => onEdit(loan)}>
                    Edit
                  </Button>

                  <Button type="button" onClick={() => onCloseLoan(loan)}>
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

const headerStyle: React.CSSProperties = {
  padding: "12px",

  textAlign: "left",

  fontWeight: 700,
};

const cellStyle: React.CSSProperties = {
  padding: "12px",

  color: "#1f2937",
};

const moneyStyle: React.CSSProperties = {
  ...cellStyle,

  textAlign: "right",

  fontWeight: 600,
};
