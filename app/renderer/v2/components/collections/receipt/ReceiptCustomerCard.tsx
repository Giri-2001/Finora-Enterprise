/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   RECEIPT CUSTOMER CARD
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

export default function ReceiptCustomerCard() {
  const {
    reviewData,
  } = useCollectionController();

  return (
    <SummaryCard title="Customer Information">
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
        Collection :
        <strong>
          {" "}
          ₹ {formatCurrency(reviewData.paymentAmount)}
        </strong>
      </span>

      <span>
        Outstanding :
        <strong>
          {" "}
          ₹ {formatCurrency(reviewData.outstandingBalance)}
        </strong>
      </span>
    </SummaryCard>
  );
}
