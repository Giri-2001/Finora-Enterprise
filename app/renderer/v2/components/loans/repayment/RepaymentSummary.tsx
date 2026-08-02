/* ===========================================================
   FINORA ENTERPRISE V2
   REPAYMENT STUDIO
   REPAYMENT SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface RepaymentSummaryProps {

  installmentAmount?: number;

  totalInstallments?: number;

  totalRepayable?: number;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function RepaymentSummary({

  installmentAmount = 0,

  totalInstallments = 0,

  totalRepayable = 0,

}: RepaymentSummaryProps) {

  return (

    <SummaryCard title="Repayment Summary">

      <span>

        Installment Amount :
        <strong> ₹ {installmentAmount}</strong>

      </span>

      <span>

        Total Installments :
        <strong> {totalInstallments}</strong>

      </span>

      <span>

        Total Repayable :
        <strong> ₹ {totalRepayable}</strong>

      </span>

    </SummaryCard>

  );

}
