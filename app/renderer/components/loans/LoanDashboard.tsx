import type { Loan } from "./types";

import LoanSummary from "./LoanSummary";

type LoanDashboardProps = {
  loans: Loan[];
};

export default function LoanDashboard({ loans }: LoanDashboardProps) {
  return (
    <div>
      <h2>Loan Dashboard</h2>

      <p
        style={{
          color: "#64748b",

          marginBottom: 20,
        }}
      >
        Overview of FINORA loan portfolio.
      </p>

      <LoanSummary loans={loans} />
    </div>
  );
}
