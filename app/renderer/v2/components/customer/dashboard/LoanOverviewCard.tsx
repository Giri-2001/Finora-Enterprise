/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   CUSTOMER DASHBOARD STUDIO
   LOAN OVERVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface LoanOverviewCardProps {

  loanId?: string;

  totalLoanAmount?: number;

  outstandingAmount?: number;

  loanStatus?: string;

  nextEmiDate?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanOverviewCard({

  loanId = "--",

  totalLoanAmount = 0,

  outstandingAmount = 0,

  loanStatus = "Active",

  nextEmiDate = "--",

}: LoanOverviewCardProps) {

  return (

    <SummaryCard title="Loan Overview">

      <span>

        Loan ID :
        <strong> {loanId}</strong>

      </span>

      <span>

        Total Loan :
        <strong> ₹ {totalLoanAmount}</strong>

      </span>

      <span>

        Outstanding :
        <strong> ₹ {outstandingAmount}</strong>

      </span>

      <span>

        Status :
        <strong> {loanStatus}</strong>

      </span>

      <span>

        Next EMI :
        <strong> {nextEmiDate}</strong>

      </span>

    </SummaryCard>

  );

}
