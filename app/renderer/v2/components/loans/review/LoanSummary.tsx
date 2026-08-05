/* ===========================================================
   FINORA ENTERPRISE V2
   REVIEW STUDIO
   LOAN SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import type {
  LoanReviewData,
} from "./types";

/* ===========================================================
   TYPES
=========================================================== */

interface LoanSummaryProps {

  review: LoanReviewData;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoanSummary({

  review,

}: LoanSummaryProps) {

  return (

    <SummaryCard title="Loan Summary">

      <span>

        Customer :
        <strong> {review.customerName}</strong>

      </span>

      <span>

        Loan Amount :
        <strong> ₹ {review.loanAmount}</strong>

      </span>

      <span>

        Interest :
        <strong> {review.interestRate}%</strong>

      </span>

      <span>

        Repayment :
        <strong>{review.repaymentType}</strong>

      </span>

      <span>

        Guarantor :
        <strong> {review.guarantorName}</strong>

      </span>

    </SummaryCard>

  );

}
