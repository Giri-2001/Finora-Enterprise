/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   CUSTOMER LOAN CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";

import {
  useCollectionController,
} from "../controller";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CustomerLoanCard() {
  const {
    reviewData,
  } = useCollectionController();

  return (
    <SummaryCard title="Customer Loan">
      <span>
        Customer :
        <strong> {reviewData.customerName || "--"}</strong>
      </span>

      <span>
        Loan Number :
        <strong> {reviewData.loanNumber || "--"}</strong>
      </span>

      <span>
        Loan Amount :
        <strong>
          ₹ {formatCurrency(reviewData.loanAmount)}
        </strong>
      </span>

      <span>
        Outstanding :
        <strong>
          ₹ {formatCurrency(reviewData.outstandingBalance)}
        </strong>
      </span>
    </SummaryCard>
  );
}
