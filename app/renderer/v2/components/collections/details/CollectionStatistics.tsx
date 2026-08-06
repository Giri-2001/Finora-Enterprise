/* ===========================================================
   FINORA ENTERPRISE OS™
   Collections Engine

   COLLECTION STATISTICS
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

export default function CollectionStatistics() {
  const {
    reviewData,
  } = useCollectionController();

  const totalCollected =
    reviewData.paymentAmount;

  const outstandingAmount =
    reviewData.outstandingBalance;

  const collectionCount =
    reviewData.paymentAmount > 0 ? 1 : 0;

  const lastCollectionDate =
    reviewData.receiptDate || "--";

  return (
    <SummaryCard title="Collection Statistics">
      <span>
        Total Collected :
        <strong> ₹ {formatCurrency(totalCollected)}</strong>
      </span>

      <span>
        Outstanding :
        <strong> ₹ {formatCurrency(outstandingAmount)}</strong>
      </span>

      <span>
        Collections :
        <strong> {collectionCount}</strong>
      </span>

      <span>
        Last Collection :
        <strong> {lastCollectionDate}</strong>
      </span>
    </SummaryCard>
  );
}
