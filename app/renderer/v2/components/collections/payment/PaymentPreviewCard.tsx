/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   PAYMENT PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import {
  useCollectionController,
} from "../controller";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function PaymentPreviewCard() {
  const {
    reviewData,
  } = useCollectionController();

  return (
    <SummaryCard title="Payment Preview">
      <span>
        Payment Method :
        <strong>
          {" "}
          {reviewData.paymentMethod || "--"}
        </strong>
      </span>

      <span>
        Reference No :
        <strong>
          {" "}
          {reviewData.paymentReference || "--"}
        </strong>
      </span>

      <span>
        Receipt No :
        <strong>
          {" "}
          {reviewData.receiptNumber || "--"}
        </strong>
      </span>

      <span>
        Collected By :
        <strong> -- </strong>
      </span>

      <span>
        Status :
        <strong> -- </strong>
      </span>
    </SummaryCard>
  );
}
