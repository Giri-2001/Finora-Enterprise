/* ===========================================================
   FINORA ENTERPRISE V2
   REVIEW STUDIO
   REVIEW PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface ReviewPreviewCardProps {

  customerName?: string;

  loanAmount?: number;

  interestRate?: number;

  repaymentFrequency?: string;

  paymentMode?: string;

  guarantorName?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReviewPreviewCard({

  customerName = "--",

  loanAmount = 0,

  interestRate = 0,

  repaymentFrequency = "--",

  paymentMode = "--",

  guarantorName = "--",

}: ReviewPreviewCardProps) {

  return (

    <SummaryCard title="Final Loan Preview">

      <span>

        Customer :
        <strong> {customerName}</strong>

      </span>

      <span>

        Loan Amount :
        <strong> ₹ {loanAmount}</strong>

      </span>

      <span>

        Interest :
        <strong> {interestRate}%</strong>

      </span>

      <span>

        Repayment :
        <strong> {repaymentFrequency}</strong>

      </span>

      <span>

        Payment Mode :
        <strong> {paymentMode}</strong>

      </span>

      <span>

        Guarantor :
        <strong> {guarantorName}</strong>

      </span>

    </SummaryCard>

  );

}
