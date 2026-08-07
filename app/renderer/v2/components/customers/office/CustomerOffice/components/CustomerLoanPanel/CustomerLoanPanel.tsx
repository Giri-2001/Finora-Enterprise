/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER LOAN PANEL™

   COMPONENT
=========================================================== */

import type { CustomerLoanPanelProps } from "./types";

import {
  LOAN_PANEL_TITLE,
  LOAN_PANEL_SUBTITLE_PREFIX,
  LOAN_STATISTICS,
} from "./constants";

import {
  buildLoanStatistics,
  getCustomerLoans,
} from "./helpers";

import {
  amountValueStyle,
  closedValueStyle,
  containerStyle,
  loansSectionStyle,
    sectionTitleStyle,
  emptyStateStyle,
  runningValueStyle,
  statisticCardStyle,
  statisticLabelStyle,
  statisticsGridStyle,
  subtitleStyle,
  titleStyle,
} from "./styles";

import LoanCard from "../LoanCard";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerLoanPanel({
  customer,
}: CustomerLoanPanelProps) {
  const loans = getCustomerLoans(customer);

  const {
    runningLoans,
    closedLoans,
    totalAmount,
    outstandingAmount,
  } = buildLoanStatistics(customer);

  return (
    <section style={containerStyle}>
      <div>
        <h2 style={titleStyle}>
          {LOAN_PANEL_TITLE}
        </h2>

        <p style={subtitleStyle}>
          {LOAN_PANEL_SUBTITLE_PREFIX} {customer.name}
        </p>
      </div>

      <section style={statisticsGridStyle}>
        <div style={statisticCardStyle}>
          <div style={statisticLabelStyle}>
            {LOAN_STATISTICS.RUNNING}
          </div>

          <div style={runningValueStyle}>
            {runningLoans}
          </div>
        </div>

        <div style={statisticCardStyle}>
          <div style={statisticLabelStyle}>
            {LOAN_STATISTICS.CLOSED}
          </div>

          <div style={closedValueStyle}>
            {closedLoans}
          </div>
        </div>

        <div style={statisticCardStyle}>
          <div style={statisticLabelStyle}>
            {LOAN_STATISTICS.TOTAL}
          </div>

          <div style={amountValueStyle}>
            ₹{totalAmount.toLocaleString()}
          </div>
        </div>

        <div style={statisticCardStyle}>
          <div style={statisticLabelStyle}>
            {LOAN_STATISTICS.PENDING}
          </div>

          <div style={amountValueStyle}>
            ₹{outstandingAmount.toLocaleString()}
          </div>
        </div>
      </section>

      <h3 style={sectionTitleStyle}>
  Recent Loans
</h3>

<section style={loansSectionStyle}>

{
  loans.length > 0

  ?

  loans.map((loan) => (
    <LoanCard
      key={loan.id}
      loan={loan}
    />
  ))

  :

  (
    <div style={emptyStateStyle}>
      No loans available
    </div>
  )
}

</section>
    </section>
  );
}
