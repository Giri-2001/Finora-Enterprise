/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   PAYMENT SUMMARY
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

export default function PaymentSummary() {
  const {
    reviewData,
  } = useCollectionController();

  return (
    <SummaryCard title="Payment Summary">
      <span>
        Total Amount :
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
        Collected By :
        <strong> -- </strong>
      </span>

      <span>
        Transaction Status :
        <strong> -- </strong>
      </span>
    </SummaryCard>
  );
}
