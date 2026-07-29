import Button from "../ui/Button";
import type { Loan } from "./types";

type LoanTableProps = {
  loans: Loan[];
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

    case "Overdue":
      return "#dc2626";

    default:
      return "#6b7280";
  }
}

export default function LoanTable({ loans }: LoanTableProps) {
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
          fontSize: 16,
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
        marginTop: 20,
        overflowX: "auto",
        borderRadius: 12,
        border: "1px solid #d1d5db",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 1500,
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

            <th style={headerStyle}>Old Loan</th>

            <th style={headerStyle}>Customer</th>

            <th style={headerStyle}>Locker</th>

            <th style={headerStyle}>Bag</th>

            <th style={headerStyle}>Loan Date</th>

            <th style={headerStyle}>Approved</th>

            <th style={headerStyle}>Deduction</th>

            <th style={headerStyle}>Received</th>

            <th style={headerStyle}>Interest</th>

            <th style={headerStyle}>Collection</th>

            <th style={headerStyle}>Duration</th>

            <th style={headerStyle}>Installment</th>

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

              <td style={cellStyle}>{loan.oldLoanNumber || "-"}</td>

              <td style={cellStyle}>{loan.customerId}</td>

              <td style={cellStyle}>{loan.lockerNumber || "-"}</td>

              <td style={cellStyle}>{loan.bagNumber || "-"}</td>

              <td style={cellStyle}>{loan.startDate}</td>

              <td
                style={{
                  ...cellStyle,
                  textAlign: "right",
                  fontWeight: 600,
                }}
              >
                {formatCurrency(loan.approvedLoanAmount)}
              </td>

              <td
                style={{
                  ...cellStyle,
                  textAlign: "right",
                }}
              >
                {formatCurrency(loan.deductionAmount)}
              </td>

              <td
                style={{
                  ...cellStyle,
                  textAlign: "right",
                  color: "#15803d",
                  fontWeight: 600,
                }}
              >
                {formatCurrency(loan.receivedAmount)}
              </td>

              <td style={cellStyle}>
                {loan.interestValue} {loan.interestType}
              </td>

              <td style={cellStyle}>{loan.collectionType}</td>

              <td style={cellStyle}>{loan.duration}</td>

              <td
                style={{
                  ...cellStyle,
                  textAlign: "right",
                }}
              >
                {formatCurrency(loan.collectionAmount)}
              </td>

              <td style={cellStyle}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: getStatusColor(loan.status),
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 600,
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
                  <Button type="button" onClick={() => {}}>
                    View
                  </Button>

                  <Button type="button" onClick={() => {}}>
                    Edit
                  </Button>

                  <Button type="button" onClick={() => {}}>
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
  fontSize: 14,
  fontWeight: 700,
  whiteSpace: "nowrap",
  borderBottom: "1px solid #334155",
};

const cellStyle: React.CSSProperties = {
  padding: "12px",
  fontSize: 14,
  color: "#1f2937",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};
