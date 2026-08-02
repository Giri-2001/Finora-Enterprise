/* ===========================================================
   FINORA ENTERPRISE V2
   COLLECTION STUDIO
   CUSTOMER LOAN CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface CustomerLoanCardProps {

  customerName?: string;

  loanNumber?: string;

  loanAmount?: number;

  outstandingAmount?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerLoanCard({

  customerName = "--",

  loanNumber = "--",

  loanAmount = 0,

  outstandingAmount = 0,

}: CustomerLoanCardProps) {

  return (

    <SummaryCard title="Customer Loan">

      <span>

        Customer :
        <strong> {customerName}</strong>

      </span>

      <span>

        Loan Number :
        <strong> {loanNumber}</strong>

      </span>

      <span>

        Loan Amount :
        <strong> ₹ {loanAmount}</strong>

      </span>

      <span>

        Outstanding :
        <strong> ₹ {outstandingAmount}</strong>

      </span>

    </SummaryCard>

  );

}
