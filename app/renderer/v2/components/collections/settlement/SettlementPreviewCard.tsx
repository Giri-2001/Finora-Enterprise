/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   SETTLEMENT PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  useCollectionController,
} from "../controller";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SettlementPreviewCard() {
  const {
    reviewData,
  } = useCollectionController();

  return (
    <SummaryCard title="Settlement Preview">
      <span>
        Customer :
        <strong>
          {" "}
          {reviewData.customerName || "--"}
        </strong>
      </span>

      <span>
        Total Loan :
        <strong>
          {" "}
          ₹ {reviewData.loanAmount}
        </strong>
      </span>

      <span>
        Total Collected :
        <strong>
          {" "}
          ₹ {reviewData.paymentAmount}
        </strong>
      </span>

      <span>
        Remaining Balance :
        <strong>
          {" "}
          ₹ {reviewData.outstandingBalance}
        </strong>
      </span>

      <span>
        Status :
        <strong>
          {" "}
          {reviewData.status}
        </strong>
      </span>
    </SummaryCard>
  );
}
