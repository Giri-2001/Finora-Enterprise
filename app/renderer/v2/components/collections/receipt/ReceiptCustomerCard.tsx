// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS ENGINE
//
// RECEIPT CUSTOMER CARD
//
// RESPONSIBILITY
//
// - Display customer information
// - Display selected loan number
// - Display collection amount
// - Display outstanding balance
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
  receiptCustomerCardStyles,
} from "./ReceiptCustomerCard.styles";

// ============================================================
// COMPONENT
// ============================================================

export default function ReceiptCustomerCard() {
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
    <SummaryCard title="Customer Information">
      <div style={receiptCustomerCardStyles.content}>
        {/* ====================================================
            CUSTOMER
        ==================================================== */}

        <span style={receiptCustomerCardStyles.detail}>
          <span style={receiptCustomerCardStyles.label}>
            Customer :
          </span>

          <strong style={receiptCustomerCardStyles.value}>
            {reviewData.customerName || "--"}
          </strong>
        </span>

        {/* ====================================================
            LOAN NUMBER
        ==================================================== */}

        <span style={receiptCustomerCardStyles.detail}>
          <span style={receiptCustomerCardStyles.label}>
            Loan Number :
          </span>

          <strong style={receiptCustomerCardStyles.value}>
            {reviewData.loanNumber || "--"}
          </strong>
        </span>

        {/* ====================================================
            COLLECTION
        ==================================================== */}

        <span style={receiptCustomerCardStyles.detail}>
          <span style={receiptCustomerCardStyles.label}>
            Collection :
          </span>

          <strong style={receiptCustomerCardStyles.value}>
            ₹ {formatCurrency(reviewData.paymentAmount)}
          </strong>
        </span>

        {/* ====================================================
            OUTSTANDING
        ==================================================== */}

        <span style={receiptCustomerCardStyles.detail}>
          <span style={receiptCustomerCardStyles.label}>
            Outstanding :
          </span>

          <strong style={receiptCustomerCardStyles.value}>
            ₹ {formatCurrency(reviewData.outstandingBalance)}
          </strong>
        </span>
      </div>
    </SummaryCard>
  );
}

// ============================================================
// END
// ============================================================