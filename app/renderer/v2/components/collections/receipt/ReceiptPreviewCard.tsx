// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS ENGINE
//
// RECEIPT PREVIEW CARD
//
// RESPONSIBILITY
//
// - Display receipt preview information
// - Display receipt number
// - Display customer
// - Display final collection amount
// - Display payment method
// - Display receipt date
// - Consume Collection Controller data
// - Keep presentation styling in dedicated style file
//
// IMPORTANT
//
// - No inline styles
// - No inline colour definitions
// - No inline responsive dimensions
// - No local theme system
// - No local breakpoint system
// - No business calculation logic
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import SummaryCard from "../../common/cards/SummaryCard";

import {
  formatCurrency,
} from "../../../utils/currency/formatCurrency";

import {
  useCollectionController,
} from "../controller";

import {
  receiptPreviewCardStyles,
} from "./ReceiptPreviewCard.styles";

// ============================================================
// COMPONENT
// ============================================================

export default function ReceiptPreviewCard() {
  // ==========================================================
  // COLLECTION CONTROLLER
  // ==========================================================

  const {
    reviewData,
  } = useCollectionController();

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <SummaryCard title="Receipt Preview">
      <div style={receiptPreviewCardStyles.content}>
        {/* ====================================================
            RECEIPT NUMBER
        ==================================================== */}

        <span style={receiptPreviewCardStyles.detail}>
          <span style={receiptPreviewCardStyles.label}>
            Receipt No :
          </span>

          <strong style={receiptPreviewCardStyles.value}>
            {reviewData.receiptNumber || "--"}
          </strong>
        </span>

        {/* ====================================================
            CUSTOMER
        ==================================================== */}

        <span style={receiptPreviewCardStyles.detail}>
          <span style={receiptPreviewCardStyles.label}>
            Customer :
          </span>

          <strong style={receiptPreviewCardStyles.value}>
            {reviewData.customerName || "--"}
          </strong>
        </span>

        {/* ====================================================
            AMOUNT
        ==================================================== */}

        <span style={receiptPreviewCardStyles.detail}>
          <span style={receiptPreviewCardStyles.label}>
            Amount :
          </span>

          <strong style={receiptPreviewCardStyles.amount}>
            ₹ {formatCurrency(reviewData.paymentAmount)}
          </strong>
        </span>

        {/* ====================================================
            PAYMENT METHOD
        ==================================================== */}

        <span style={receiptPreviewCardStyles.detail}>
          <span style={receiptPreviewCardStyles.label}>
            Payment Method :
          </span>

          <strong style={receiptPreviewCardStyles.value}>
            {reviewData.paymentMethod || "--"}
          </strong>
        </span>

        {/* ====================================================
            RECEIPT DATE
        ==================================================== */}

        <span style={receiptPreviewCardStyles.detail}>
          <span style={receiptPreviewCardStyles.label}>
            Receipt Date :
          </span>

          <strong style={receiptPreviewCardStyles.value}>
            {reviewData.receiptDate || "--"}
          </strong>
        </span>
      </div>
    </SummaryCard>
  );
}

// ============================================================
// END
// ============================================================