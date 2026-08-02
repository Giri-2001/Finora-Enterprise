/* ===========================================================
   FINORA ENTERPRISE V2
   REVIEW STUDIO
   LOAN SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

/* ===========================================================
   TYPES
=========================================================== */

interface LoanSummaryProps {

  customerName?: string;

  loanAmount?: number;

  interestRate?: number;

  repaymentFrequency?: string;

  guarantorName?: string;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanSummary({

  customerName = "--",

  loanAmount = 0,

  interestRate = 0,

  repaymentFrequency = "--",

  guarantorName = "--",

}: LoanSummaryProps) {

  return (

    <SummaryCard title="Loan Summary">

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

        Guarantor :
        <strong> {guarantorName}</strong>

      </span>

    </SummaryCard>

  );

}
