/* ===========================================================
   FINORA ENTERPRISE V2
   REVIEW STUDIO
   VALIDATION CHECKLIST
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import type {
  LoanReviewData,
} from "./types";


/* ===========================================================
   TYPES
=========================================================== */

interface ValidationChecklistProps {

  review: LoanReviewData;

}

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ValidationChecklist({

  review,

}: ValidationChecklistProps) {

  return (

    <SummaryCard title="Validation Checklist">

      <ul
  style={{
    margin: 0,
    paddingLeft: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  }}
>
  <li>
    {review.customerName
      ? "✅ Customer information completed"
      : "❌ Customer information missing"}
  </li>

  <li>
    {review.interestRate > 0
      ? "✅ Finance configuration verified"
      : "❌ Finance configuration incomplete"}
  </li>

  <li>
    {review.totalInstallments > 0
      ? "✅ Repayment schedule generated"
      : "❌ Repayment schedule not generated"}
  </li>

  <li>
    {review.guarantorName
      ? "✅ Guarantor details verified"
      : "❌ Guarantor details missing"}
  </li>

  <li>
    {review.netDisbursement > 0
      ? "✅ Disbursement details confirmed"
      : "❌ Disbursement not configured"}
  </li>

  <li>
    {review.loanStatus === "Pending Approval"
      ? "✅ Loan ready for approval"
      : "ℹ️ Loan status updated"}
  </li>
</ul>

    </SummaryCard>

  );

}
