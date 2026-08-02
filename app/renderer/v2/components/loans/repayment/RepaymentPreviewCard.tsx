/* ===========================================================
   FINORA ENTERPRISE V2
   REPAYMENT STUDIO
   REPAYMENT PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface RepaymentPreviewCardProps {

  frequency?: string;

  installmentAmount?: number;

  totalInstallments?: number;

  firstInstallmentDate?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RepaymentPreviewCard({

  frequency = "--",

  installmentAmount = 0,

  totalInstallments = 0,

  firstInstallmentDate = "--",

}: RepaymentPreviewCardProps) {

  return (

    <SummaryCard title="Repayment Preview">

      <span>

        Frequency :
        <strong> {frequency}</strong>

      </span>

      <span>

        Installment :
        <strong> ₹ {installmentAmount}</strong>

      </span>

      <span>

        Total Installments :
        <strong> {totalInstallments}</strong>

      </span>

      <span>

        First Installment :
        <strong> {firstInstallmentDate}</strong>

      </span>

    </SummaryCard>

  );

}
