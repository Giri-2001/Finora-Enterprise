/* ===========================================================
   FINORA ENTERPRISE V2
   CUSTOMER SELF-SERVICE PORTAL
   MY LOANS STUDIO
   LOAN PROGRESS CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface LoanProgressCardProps {

  totalInstallments?: number;

  paidInstallments?: number;

  remainingInstallments?: number;

  completionPercentage?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanProgressCard({

  totalInstallments = 0,

  paidInstallments = 0,

  remainingInstallments = 0,

  completionPercentage = 0,

}: LoanProgressCardProps) {

  return (

    <SummaryCard title="Loan Progress">

      <span>

        Total Installments :
        <strong> {totalInstallments}</strong>

      </span>

      <span>

        Paid :
        <strong> {paidInstallments}</strong>

      </span>

      <span>

        Remaining :
        <strong> {remainingInstallments}</strong>

      </span>

      <span>

        Completion :
        <strong> {completionPercentage}%</strong>

      </span>

    </SummaryCard>

  );

}
