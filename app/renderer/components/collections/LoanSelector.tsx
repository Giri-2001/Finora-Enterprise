import type { Loan } from "../loans/types";

type LoanSelectorProps = {
  loans: Loan[];

  selectedLoanId: string;

  onSelect: (loanId: string) => void;
};

export default function LoanSelector({
  loans,
  selectedLoanId,
  onSelect,
}: LoanSelectorProps) {
  const activeLoans = loans.filter((loan) => loan.status === "Active");

  return (
    <select
      value={selectedLoanId}
      onChange={(e) => onSelect(e.target.value)}
      style={{
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #334155",
        width: "100%",
      }}
    >
      <option value="">Select Loan</option>

      {activeLoans.map((loan) => (
        <option key={loan.id} value={loan.id.toString()}>
          {loan.finoraLoanId} - ₹
          {loan.approvedLoanAmount.toLocaleString("en-IN")} (
          {loan.collectionType})
        </option>
      ))}
    </select>
  );
}
