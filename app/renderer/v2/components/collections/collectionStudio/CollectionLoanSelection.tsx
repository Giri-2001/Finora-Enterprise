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
// - Consume FINORA Responsive Engine
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
// - No local breakpoint logic
// - Theme is owned by FINORA Theme Engine
// - Responsive classification is owned by FINORA Responsive Engine
//
// RESPONSIVE CONTRACT
//
// MOBILE
// - Header stacks
// - Loan dropdown becomes full width
// - One loan card per row
//
// TABLET
// - Two loan cards per row
//
// LAPTOP / DESKTOP
// - Existing premium geometry remains unchanged
//
// VERSION : 2.1
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

import { WalletCards } from "lucide-react";

import { useTheme } from "../../../themes/provider";

import { useResponsive } from "../../../utils/responsive";

import {
  createCollectionStudioLoansHeaderStyle,
  createCollectionStudioLoanDropdownWrapperStyle,
  createCollectionStudioLoanCardsGridStyle,
} from "../../../utils/responsive/collections/collectionStudio.layout";

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
  // ==========================================================

  const { theme } = useTheme();

  // ==========================================================
  // FINORA RESPONSIVE ENGINE
  // ==========================================================

  const { viewport, tokens } = useResponsive();

  // ==========================================================
  // THEME-AWARE PRESENTATION STYLES
  // ==========================================================

  const styles = createCollectionLoanSelectionStyles(theme);

  // ==========================================================
  // RESPONSIVE HEADER STYLE
  // ==========================================================

  const responsiveLoansHeaderStyle: CSSProperties = {
    ...styles.loansHeader,

    ...createCollectionStudioLoansHeaderStyle(tokens, viewport),
  };

  // ==========================================================
  // RESPONSIVE LOAN DROPDOWN WRAPPER
  // ==========================================================

  const responsiveLoanDropdownWrapperStyle: CSSProperties = {
    ...styles.loanDropdownWrapper,

    ...createCollectionStudioLoanDropdownWrapperStyle(viewport),
  };

  // ==========================================================
  // RESPONSIVE LOAN CARDS GRID
  // ==========================================================

  const responsiveLoanCardsGridStyle: CSSProperties = {
    ...styles.loanCardsGrid,

    ...createCollectionStudioLoanCardsGridStyle(tokens, viewport),
  };

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (loans.length === 0) {
    return (
      <section style={styles.loansCard}>
        <div style={responsiveLoansHeaderStyle}>
          <div style={styles.headingGroup}>
            <div style={styles.sectionHeading}>
              <WalletCards
                size={styles.iconSize}
                strokeWidth={2}
                aria-hidden="true"
                style={styles.sectionIcon}
              />

              <div style={styles.titleGroup as CSSProperties}>
                <h2 style={styles.sectionTitle}>Customer Loans</h2>

                <p style={styles.sectionSubtitle}>
                  Select the loan for collection
                </p>
              </div>
            </div>
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
      ================================================== */}

      <div style={responsiveLoansHeaderStyle}>
        <div style={styles.headingGroup}>
          <div style={styles.sectionHeading}>
            <WalletCards
              size={styles.iconSize}
              strokeWidth={2}
              aria-hidden="true"
              style={styles.sectionIcon}
            />

            <div style={styles.titleGroup}>
              <h2 style={styles.sectionTitle}>Customer Loans</h2>

              <p style={styles.sectionSubtitle}>
                Select the loan for collection
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            SELECTED LOAN DROPDOWN
        ================================================= */}

        <div style={responsiveLoanDropdownWrapperStyle}>
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

      <div style={responsiveLoanCardsGridStyle}>
        {loans.map((loan) => {
          const isSelected = loan.id === selectedLoanId;

          // ================================================
          // CARD PRESENTATION
          // ================================================

          const cardStyle: CSSProperties = {
            ...styles.loanCard,

            ...(isSelected ? styles.loanCardSelected : {}),
          };

          // ================================================
          // STATUS PRESENTATION
          // ================================================

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
              {/* ==========================================
                    LOAN NUMBER + STATUS
                ========================================== */}

              <div style={styles.loanCardTopRow}>
                <span style={styles.loanCardNumber}>{loan.loanNumber}</span>

                <span style={statusStyle}>{loan.status}</span>
              </div>

              {/* ==========================================
                    LOAN AMOUNT + REPAYMENT TYPE
                ========================================== */}

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
