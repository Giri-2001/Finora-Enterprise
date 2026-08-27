// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// SELECTED LOAN PREVIEW
//
// RESPONSIBILITY
//
// - Render selected loan preview
// - Display principal
// - Display repayment type
// - Display outstanding amount
// - Display loan status
// - Consume dedicated presentation styles
// - Theme appearance is provided by FINORA Theme Engine
//   through the dedicated styles file
//
// IMPORTANT
//
// - No inline colours
// - No inline responsive dimensions
// - No local theme system
// - No local responsive system
// - No business calculations
// - No status colour logic inside component
// - All presentation geometry comes from
//   CollectionSelectedLoan.styles.ts
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

import { collectionSelectedLoanStyles } from "./CollectionSelectedLoan.styles";

// ============================================================
// TYPES
// ============================================================

export interface CollectionSelectedLoanData {
  loanNumber: string;
  principal: number;
  repaymentType: string;
  outstanding: number;
  status: string;
}

export interface CollectionSelectedLoanProps {
  loan: CollectionSelectedLoanData;

  formatCurrency: (value: number) => string;
}

// ============================================================
// COMPONENT
// ============================================================

export default function CollectionSelectedLoan({
  loan,
  formatCurrency,
}: CollectionSelectedLoanProps) {
  // ==========================================================
  // STATUS
  //
  // Status presentation is intentionally delegated to the
  // dedicated style contract.
  //
  // The style file consumes FINORA Theme Engine variables.
  // No theme object is accessed here.
  // ==========================================================

  const statusStyle: CSSProperties = {
    ...collectionSelectedLoanStyles.selectedLoanStatus,
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section style={collectionSelectedLoanStyles.selectedLoanCard}>
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div style={collectionSelectedLoanStyles.selectedLoanHeader}>
        <div>
          <span style={collectionSelectedLoanStyles.selectedLoanEyebrow}>
            SELECTED LOAN
          </span>

          <h2 style={collectionSelectedLoanStyles.selectedLoanTitle}>
            {loan.loanNumber}
          </h2>
        </div>

        <span style={statusStyle}>{loan.status}</span>
      </div>

      {/* ====================================================
          FINANCIAL METRICS
      ==================================================== */}

      <div style={collectionSelectedLoanStyles.selectedLoanGrid}>
        {/* ==================================================
            PRINCIPAL
        ================================================== */}

        <div style={collectionSelectedLoanStyles.selectedLoanMetric}>
          <span style={collectionSelectedLoanStyles.metricLabel}>
            Principal
          </span>

          <strong style={collectionSelectedLoanStyles.metricValue}>
            {formatCurrency(loan.principal)}
          </strong>
        </div>

        {/* ==================================================
            REPAYMENT TYPE
        ================================================== */}

        <div style={collectionSelectedLoanStyles.selectedLoanMetric}>
          <span style={collectionSelectedLoanStyles.metricLabel}>
            Repayment Type
          </span>

          <strong style={collectionSelectedLoanStyles.metricValue}>
            {loan.repaymentType}
          </strong>
        </div>

        {/* ==================================================
            OUTSTANDING
        ================================================== */}

        <div style={collectionSelectedLoanStyles.selectedLoanMetric}>
          <span style={collectionSelectedLoanStyles.metricLabel}>
            Outstanding
          </span>

          <strong style={collectionSelectedLoanStyles.metricValue}>
            {formatCurrency(loan.outstanding)}
          </strong>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================
