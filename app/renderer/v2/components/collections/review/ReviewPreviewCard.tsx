/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   REVIEW PREVIEW CARD
=========================================================== */

import SummaryCard from "../../common/cards/SummaryCard";

import { formatCurrency } from "../../../utils/currency/formatCurrency";

import {
  useCollectionController,
} from "../controller";

/* ===========================================================
   COMPONENT
=========================================================== */

export default function ReviewPreviewCard() {
  const {
    reviewData,
  } = useCollectionController();

  const formattedPaymentAmount = formatCurrency(
  reviewData.paymentAmount,
);

  return (
    <SummaryCard title="Collection Review Preview">
      <span>
        Customer :
        <strong>
  {" "}
  {formattedPaymentAmount}
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
        Payment Method :
        <strong>
          {" "}
          {reviewData.paymentMethod || "--"}
        </strong>
      </span>

      <span>
        Receipt Number :
        <strong>
          {" "}
          {reviewData.receiptNumber || "--"}
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
