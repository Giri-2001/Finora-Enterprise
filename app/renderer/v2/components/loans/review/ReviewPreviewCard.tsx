/* ===========================================================
   FINORA ENTERPRISE V2
   REVIEW STUDIO
   REVIEW PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import type {
  LoanReviewData,
} from "./types";

/* ===========================================================
   TYPES
=========================================================== */

interface ReviewPreviewCardProps {

  review: LoanReviewData;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReviewPreviewCard({

  review,

}: ReviewPreviewCardProps) {

  return (

    <SummaryCard title="Final Loan Preview">

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
        <strong> {review.repaymentType}</strong>

      </span>

      <span>

        Payment Mode :
        <strong> Pending</strong>

      </span>

      <span>

        Guarantor :
        <strong> {review.guarantorName}</strong>

      </span>

    </SummaryCard>

  );

}
