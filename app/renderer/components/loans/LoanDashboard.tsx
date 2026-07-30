import type { Loan } from "./types";

import Card from "../ui/Card";
import LoanSummary from "./LoanSummary";

type LoanDashboardProps = {
  loans: Loan[];
};

export default function LoanDashboard({ loans }: LoanDashboardProps) {
  return (
    <section className="w-full">
      <Card
        title="Loan Dashboard"
        subtitle="Overview of FINORA loan portfolio and financial status."
      >
        <div className="space-y-6">
          <LoanSummary loans={loans} />
        </div>
      </Card>
    </section>
  );
}
