import type { Loan } from "./types";

type LoanSearchProps = {
  loans: Loan[];

  onSearch: (value: string) => void;
};

export default function LoanSearch({ onSearch }: LoanSearchProps) {
  return (
    <div
      style={{
        marginBottom: 20,
      }}
    >
      <input
        type="text"
        placeholder="Search Loan ID, Old Loan Number or Customer ID..."
        onChange={(event) => onSearch(event.target.value)}
        style={{
          width: "100%",

          padding: "12px",

          borderRadius: 8,

          border: "1px solid #cbd5e1",

          fontSize: 14,
        }}
      />
    </div>
  );
}
