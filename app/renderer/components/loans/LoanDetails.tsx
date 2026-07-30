import type { Loan } from "./types";

import Card from "../ui/Card";

type LoanDetailsProps = {
  loan: Loan;
};

function safeNumber(value?: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatCurrency(value?: number): string {
  return `₹${safeNumber(value).toLocaleString("en-IN")}`;
}

export default function LoanDetails({ loan }: LoanDetailsProps) {
  const fields = [
    { label: "FINORA Loan ID", value: loan.finoraLoanId },
    { label: "Old Loan Number", value: loan.oldLoanNumber || "-" },
    { label: "Customer ID", value: loan.customerId || "-" },
    {
      label: "Approved Amount",
      value: formatCurrency(loan.approvedLoanAmount),
    },
    {
      label: "Received Amount",
      value: formatCurrency(loan.receivedAmount),
    },
    {
      label: "Deduction",
      value: formatCurrency(loan.deductionAmount),
    },
    {
      label: "Discount",
      value: formatCurrency(loan.discountAmount),
    },
    {
      label: "Total Collected",
      value: formatCurrency(loan.totalCollectedAmount),
    },
    {
      label: "Outstanding Balance",
      value: formatCurrency(loan.outstandingAmount),
    },
    {
      label: "Interest",
      value: `${safeNumber(loan.interestValue)} ${loan.interestType}`,
    },
    {
      label: "Collection Type",
      value: loan.collectionType,
    },
    {
      label: "Duration",
      value: loan.duration,
    },
    {
      label: "Status",
      value: loan.status,
    },
    {
      label: "Locker Number",
      value: loan.lockerNumber || "-",
    },
    {
      label: "Bag Number",
      value: loan.bagNumber || "-",
    },
    {
      label: "Start Date",
      value: loan.startDate || "-",
    },
    {
      label: "Remarks",
      value: loan.remarks || "-",
    },
  ];

  return (
    <Card title="Loan Details" subtitle="Complete FINORA loan information">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
        }}
      >
        {fields.map((field) => (
          <div
            key={field.label}
            style={{
              padding: 16,
              borderRadius: 14,
              background: "var(--surface)",
              border: "1px solid var(--surface-border)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              {field.label}
            </div>

            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text)",
                wordBreak: "break-word",
              }}
            >
              {field.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
