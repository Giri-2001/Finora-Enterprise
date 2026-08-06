/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   COLLECTION PREVIEW CARD
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

export default function CollectionPreviewCard() {
  const {
    reviewData,
  } = useCollectionController();

  return (
    <SummaryCard title="Collection Preview">
      <span>
        Customer :
        <strong>
          {" "}
          {reviewData.customerName || "--"}
        </strong>
      </span>

      <span>
        Collection Date :
        <strong>
          {" "}
          {reviewData.receiptDate || "--"}
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
        Payment Mode :
        <strong>
          {" "}
          {reviewData.paymentMethod || "--"}
        </strong>
      </span>

      <span>
        Remarks :
        <strong>
          {" "}
          {reviewData.remarks || "--"}
        </strong>
      </span>
    </SummaryCard>
  );
}
