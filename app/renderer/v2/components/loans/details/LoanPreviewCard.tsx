/* ===========================================================
   FINORA ENTERPRISE V2
   LOAN DETAILS STUDIO
   LOAN PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface LoanPreviewCardProps {

  customerName?: string;

  loanAmount?: number;

  loanType?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanPreviewCard({

  customerName = "--",

  loanAmount = 0,

  loanType = "--",

}: LoanPreviewCardProps) {

  return (

    <SummaryCard title="Loan Preview">

      <span>

        Customer : <strong>{customerName}</strong>

      </span>

      <span>

        Loan Amount : <strong>₹ {loanAmount}</strong>

      </span>

      <span>

        Loan Type : <strong>{loanType}</strong>

      </span>

    </SummaryCard>

  );

}
