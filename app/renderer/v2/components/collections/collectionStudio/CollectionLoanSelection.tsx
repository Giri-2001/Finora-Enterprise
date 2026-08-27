// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// CUSTOMER LOAN SELECTION
//
// RESPONSIBILITY
//
// - Display available loans for selected customer
// - Allow user to select a loan
// - Display selected loan state
// - Display selected-loan dropdown in the header row
// - Keep presentation styles in dedicated style file
//
// ARCHITECTURE LOCK
//
// - No business logic changes
// - No persistence changes
// - No service changes
// - No selection-flow changes
// - No inline colours
// - No inline theme values
// - No inline responsive values
// - Theme is owned by FINORA Theme Engine
// - Visual styles are owned by dedicated style file
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

import { WalletCards } from "lucide-react";

import { useTheme } from "../../../themes/provider";

import { createCollectionLoanSelectionStyles } from "./CollectionLoanSelection.styles";

// ============================================================
// TYPES
// ============================================================

export interface CollectionLoanSelectionRecord {
  id: string;

  loanNumber: string;

  amount: number;

  repaymentType: string;

  status: string;

  outstanding: number;
}

// ============================================================
// PROPS
// ============================================================

export interface CollectionLoanSelectionProps {
  loans: CollectionLoanSelectionRecord[];

  selectedLoanId: string | null;

  onSelectLoan: (loan: CollectionLoanSelectionRecord) => void;
}

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;

  return `₹ ${safeValue.toLocaleString("en-IN")}`;
}

// ============================================================
// COMPONENT
// ============================================================

export default function CollectionLoanSelection({
  loans,

  selectedLoanId,

  onSelectLoan,
}: CollectionLoanSelectionProps) {
  // ==========================================================
  // FINORA THEME ENGINE
  //
  // Presentation only.
  //
  // The active theme comes from the central registered
  // FINORA Theme Registry through ThemeProvider.
  //
  // No theme definitions are created here.
  // ==========================================================

  const { theme } = useTheme();

  // ==========================================================
  // THEME-AWARE PRESENTATION STYLES
  // ==========================================================

  const styles = createCollectionLoanSelectionStyles(theme);

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (loans.length === 0) {
    return (
      <section style={styles.loansCard}>
        <div style={styles.loansHeader}>
          <div style={styles.headingGroup}>
            <div style={styles.sectionHeading}>
              <WalletCards
                size={styles.iconSize}
                strokeWidth={2}
                aria-hidden="true"
                style={styles.sectionIcon}
              />

              <h2 style={styles.sectionTitle}>Customer Loans</h2>
            </div>

            <p style={styles.sectionSubtitle}>Select the loan for collection</p>
          </div>
        </div>

        <div style={styles.emptyState}>
          <span style={styles.emptyStateTitle}>No active loans</span>

          <span style={styles.emptyStateMessage}>
            This customer has no loans available for collection.
          </span>
        </div>
      </section>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section style={styles.loansCard}>
      {/* ==================================================
          HEADER

          IMPORTANT:
          The dropdown remains in this same horizontal
          header row as the Customer Loans heading.
      ================================================== */}

      <div style={styles.loansHeader}>
        <div style={styles.headingGroup}>
          <div style={styles.sectionHeading}>
            <WalletCards
              size={styles.iconSize}
              strokeWidth={2}
              aria-hidden="true"
              style={styles.sectionIcon}
            />

            <h2 style={styles.sectionTitle}>Customer Loans</h2>
          </div>

          <p style={styles.sectionSubtitle}>Select the loan for collection</p>
        </div>

        {/* =================================================
            SELECTED LOAN DROPDOWN
        ================================================= */}

        <div style={styles.loanDropdownWrapper}>
          <select
            value={selectedLoanId ?? ""}
            onChange={(event) => {
              const loan = loans.find((item) => item.id === event.target.value);

              if (loan) {
                onSelectLoan(loan);
              }
            }}
            aria-label="Select loan"
            style={styles.loanDropdown}
          >
            {loans.map((loan) => (
              <option key={loan.id} value={loan.id}>
                {loan.loanNumber}
              </option>
            ))}
          </select>

          <span aria-hidden="true" style={styles.loanDropdownArrow}>
            ▾
          </span>
        </div>
      </div>

      {/* ==================================================
          LOAN CARDS
      ================================================== */}

      <div style={styles.loanCardsGrid}>
        {loans.map((loan) => {
          const isSelected = loan.id === selectedLoanId;

          // ==================================================
          // CARD PRESENTATION
          // ==================================================

          const cardStyle: CSSProperties = {
            ...styles.loanCard,

            ...(isSelected ? styles.loanCardSelected : {}),
          };

          // ==================================================
          // STATUS PRESENTATION
          // ==================================================

          const statusStyle: CSSProperties = {
            ...styles.loanStatus,

            ...(isSelected ? styles.loanStatusSelected : {}),
          };

          return (
            <button
              key={loan.id}
              type="button"
              onClick={() => onSelectLoan(loan)}
              aria-pressed={isSelected}
              style={cardStyle}
            >
              {/* ============================================
                  LOAN NUMBER + STATUS
              ============================================ */}

              <div style={styles.loanCardTopRow}>
                <span style={styles.loanCardNumber}>{loan.loanNumber}</span>

                <span style={statusStyle}>{loan.status}</span>
              </div>

              {/* ============================================
                  LOAN AMOUNT + REPAYMENT TYPE
              ============================================ */}

              <div style={styles.loanCardTopRow}>
                <span style={styles.loanCardAmount}>
                  {formatCurrency(loan.amount)}
                </span>

                <span style={styles.loanCardType} title={loan.repaymentType}>
                  {loan.repaymentType}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================
