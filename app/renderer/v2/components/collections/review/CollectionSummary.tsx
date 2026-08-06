/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   COLLECTION SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import { formatCurrency } from "../../../utils/currency/formatCurrency";

import {
  useCollectionController,
} from "../controller";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function CollectionSummary() {
  const {
    reviewData,
  } = useCollectionController();

  const formattedPaymentAmount = formatCurrency(
  reviewData.paymentAmount,
);

const formattedOutstandingBalance = formatCurrency(
  reviewData.outstandingBalance,
);

  return (
    <SummaryCard title="Collection Summary">
      <span>
        Customer :
        <strong>
          {" "}
          {reviewData.customerName || "--"}
        </strong>
      </span>

      <span>
        Loan Number :
        <strong>
          {" "}
          {reviewData.loanNumber || "--"}
        </strong>
      </span>

      <span>
        Total Collected :
        <strong>
  {" "}
  {formattedPaymentAmount}
</strong>
      </span>

      <span>
        Outstanding Balance :
        <strong>
  {" "}
  {formattedOutstandingBalance}
</strong>
      </span>

      <span>
        Settlement Status :
        <strong>
          {" "}
          {reviewData.status}
        </strong>
      </span>
    </SummaryCard>
  );
}
