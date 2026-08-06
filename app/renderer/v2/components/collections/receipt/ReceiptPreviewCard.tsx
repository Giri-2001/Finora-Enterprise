/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   RECEIPT PREVIEW CARD
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

export default function ReceiptPreviewCard() {
  const {
    reviewData,
  } = useCollectionController();

  return (
    <SummaryCard title="Receipt Preview">
      <span>
        Receipt No :
        <strong>
          {" "}
          {reviewData.receiptNumber || "--"}
        </strong>
      </span>

      <span>
        Customer :
        <strong>
          {" "}
          {reviewData.customerName || "--"}
        </strong>
      </span>

      <span>
        Amount :
        <strong>
          {" "}
          ₹ {formatCurrency(reviewData.paymentAmount)}
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
        Receipt Date :
        <strong>
          {" "}
          {reviewData.receiptDate || "--"}
        </strong>
      </span>
    </SummaryCard>
  );
}
