// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// SYSTEM GENERATED
//
// RESPONSIBILITY
//
// - Display system calculated collection values
// - Show principal due
// - Show accrued interest
// - Show late fee / penalty
// - Show generated total
// - Clearly communicate that values are auto calculated
// - Keep calculated values locked from manual editing
//
// IMPORTANT
//
// - No financial calculation engine here
// - No persistence here
// - No local theme system
// - No local responsive system
// - Controller remains the source of truth
// - Visual styles remain inside dedicated styles file
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { collectionSystemGeneratedStyles } from "./CollectionSystemGenerated.styles";

import { useCollectionController } from "../controller";

import { formatCurrency } from "../../../utils/currency/formatCurrency";

// ============================================================
// COMPONENT
// ============================================================

export default function CollectionSystemGenerated() {
  const { reviewData } = useCollectionController();

  // ==========================================================
  // SYSTEM GENERATED VALUES
  //
  // These values are presentation values only.
  // The controller / domain layer remains the source of truth.
  // ==========================================================

  const principalDue = Math.max(
    0,
    Number(reviewData.outstandingBalance ?? 0) -
      Number(reviewData.todayDue ?? 0) -
      Number(reviewData.penaltyAmount ?? 0),
  );

  const accruedInterest = Number(reviewData.todayDue ?? 0);

  const lateFee = Number(reviewData.penaltyAmount ?? 0);

  const generatedTotal = Math.max(0, principalDue + accruedInterest + lateFee);

  // ==========================================================
  // CURRENCY
  // ==========================================================

  function currency(value: number): string {
    return `₹ ${formatCurrency(value)}`;
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section style={collectionSystemGeneratedStyles.panel}>
      {/* ====================================================
          HEADER
      ==================================================== */}

      <header style={collectionSystemGeneratedStyles.header}>
        <div style={collectionSystemGeneratedStyles.titleGroup}>
          <span aria-hidden="true" style={collectionSystemGeneratedStyles.lock}>
            🔒
          </span>

          <div>
            <h2 style={collectionSystemGeneratedStyles.title}>
              3. System Generated (Auto Calculated)
            </h2>

            <div style={collectionSystemGeneratedStyles.subtitle}>
              Calculated automatically from loan terms and payment history.
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================
          FINANCIAL VALUES
      ==================================================== */}

      <div style={collectionSystemGeneratedStyles.financialList}>
        {/* ==================================================
            PRINCIPAL DUE
        ================================================== */}

        <div style={collectionSystemGeneratedStyles.financialRow}>
          <span style={collectionSystemGeneratedStyles.financialLabel}>
            Principal Due
          </span>

          <strong style={collectionSystemGeneratedStyles.financialValue}>
            {currency(principalDue)}
          </strong>
        </div>

        {/* ==================================================
            ACCRUED INTEREST
        ================================================== */}

        <div style={collectionSystemGeneratedStyles.financialRow}>
          <span style={collectionSystemGeneratedStyles.financialLabel}>
            Accrued Interest (till today)
          </span>

          <strong style={collectionSystemGeneratedStyles.financialValue}>
            {currency(accruedInterest)}
          </strong>
        </div>

        {/* ==================================================
            LATE FEE
        ================================================== */}

        <div style={collectionSystemGeneratedStyles.financialRow}>
          <span style={collectionSystemGeneratedStyles.financialLabel}>
            Late Fee / Penalty
          </span>

          <strong style={collectionSystemGeneratedStyles.financialValue}>
            {currency(lateFee)}
          </strong>
        </div>
      </div>

      {/* ====================================================
          TOTAL DIVIDER
      ==================================================== */}

      <div style={collectionSystemGeneratedStyles.totalDivider} />

      {/* ====================================================
          GENERATED TOTAL
      ==================================================== */}

      <div style={collectionSystemGeneratedStyles.generatedTotal}>
        <span style={collectionSystemGeneratedStyles.generatedTotalLabel}>
          Generated Total
        </span>

        <strong style={collectionSystemGeneratedStyles.generatedTotalValue}>
          {currency(generatedTotal)}
        </strong>
      </div>

      {/* ====================================================
          LOCKED INFORMATION NOTICE
      ==================================================== */}

      <div style={collectionSystemGeneratedStyles.notice}>
        <span
          aria-hidden="true"
          style={collectionSystemGeneratedStyles.noticeIcon}
        >
          ⓘ
        </span>

        <div style={collectionSystemGeneratedStyles.noticeContent}>
          <strong style={collectionSystemGeneratedStyles.noticeTitle}>
            This amount is auto calculated and locked.
          </strong>

          <span style={collectionSystemGeneratedStyles.noticeMessage}>
            Based on loan terms and recorded payments.
          </span>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================
