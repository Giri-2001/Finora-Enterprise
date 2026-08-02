/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   MY LOANS STUDIO
   ACTIVE LOAN CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ActiveLoanCardProps {

  loanNumber?: string;

  sanctionedAmount?: number;

  outstandingAmount?: number;

  nextEmiAmount?: number;

  loanStatus?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ActiveLoanCard({

  loanNumber = "--",

  sanctionedAmount = 0,

  outstandingAmount = 0,

  nextEmiAmount = 0,

  loanStatus = "Active",

}: ActiveLoanCardProps) {

  return (

    <SummaryCard title="Active Loan">

      <span>

        Loan Number :
        <strong> {loanNumber}</strong>

      </span>

      <span>

        Sanctioned Amount :
        <strong> ₹ {sanctionedAmount}</strong>

      </span>

      <span>

        Outstanding :
        <strong> ₹ {outstandingAmount}</strong>

      </span>

      <span>

        Next EMI :
        <strong> ₹ {nextEmiAmount}</strong>

      </span>

      <span>

        Status :
        <strong> {loanStatus}</strong>

      </span>

    </SummaryCard>

  );

}
