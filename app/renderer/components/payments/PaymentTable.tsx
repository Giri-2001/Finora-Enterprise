import type { Payment } from "./types";

type PaymentTableProps = {
  payments: Payment[];

  onDelete?: (id: string) => void;
};

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function PaymentTable({
  payments,

  onDelete,
}: PaymentTableProps) {
  if (payments.length === 0) {
    return (
      <div
        style={{
          padding: 20,

          background: "#1e293b",

          color: "#ffffff",

          borderRadius: 12,

          textAlign: "center",
        }}
      >
        No payments available.
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: "auto",
      }}
    >
      <table
        style={{
          width: "100%",

          borderCollapse: "collapse",

          marginTop: 20,
        }}
      >
        <thead>
          <tr>
            <th style={cellStyle}>Payment No</th>

            <th style={cellStyle}>Loan ID</th>

            <th style={cellStyle}>Customer</th>

            <th style={cellStyle}>Date</th>

            <th style={cellStyle}>Type</th>

            <th style={cellStyle}>Amount</th>

            <th style={cellStyle}>Mode</th>

            <th style={cellStyle}>Balance</th>

            <th style={cellStyle}>Status</th>

            <th style={cellStyle}>Action</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td style={cellStyle}>{payment.paymentNumber}</td>

              <td style={cellStyle}>{payment.loanId}</td>

              <td style={cellStyle}>{payment.customerId}</td>

              <td style={cellStyle}>{payment.paymentDate}</td>

              <td style={cellStyle}>{payment.paymentType}</td>

              <td style={cellStyle}>{formatCurrency(payment.amount)}</td>

              <td style={cellStyle}>{payment.paymentMode}</td>

              <td style={cellStyle}>
                {formatCurrency(payment.remainingBalance)}
              </td>

              <td style={cellStyle}>{payment.status}</td>

              <td style={cellStyle}>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(payment.id)}
                    style={{
                      background: "#dc2626",

                      color: "#ffffff",

                      border: "none",

                      padding: "6px 12px",

                      borderRadius: 6,

                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cellStyle = {
  borderBottom: "1px solid #334155",

  padding: "12px",

  textAlign: "left" as const,
};
