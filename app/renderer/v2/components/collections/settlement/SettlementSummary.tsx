/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   SETTLEMENT SUMMARY
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  useCollectionController,
} from "../controller";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SettlementSummary() {
  const {
    reviewData,
  } = useCollectionController();

  return (
    <SummaryCard title="Settlement Summary">
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
        Settlement Status :
        <strong>
          {" "}
          {reviewData.status}
        </strong>
      </span>
    </SummaryCard>
  );
}
