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
// - No inline colours
// - No inline theme values
// - No inline responsive values
// - No local breakpoint system
// - No local CSS palette
// - Theme is owned by FINORA Theme Engine
// - Responsive geometry is owned by Responsive Engine
// - Visual styles are owned by dedicated style file
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

import { collectionLoanSelectionStyles } from "./CollectionLoanSelection.styles";

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
  return `₹ ${value.toLocaleString("en-IN")}`;
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
  // EMPTY STATE
  // ==========================================================

  if (loans.length === 0) {
    return (
      <section style={collectionLoanSelectionStyles.loansCard}>
        <div style={collectionLoanSelectionStyles.loansHeader}>
          <div>
            <h2 style={collectionLoanSelectionStyles.sectionTitle}>
              Customer Loans
            </h2>

            <p style={collectionLoanSelectionStyles.sectionSubtitle}>
              Select the loan for collection
            </p>
          </div>
        </div>

        <div style={collectionLoanSelectionStyles.emptyState}>
          <span style={collectionLoanSelectionStyles.emptyStateTitle}>
            No active loans
          </span>

          <span style={collectionLoanSelectionStyles.emptyStateMessage}>
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
    <section style={collectionLoanSelectionStyles.loansCard}>
      {/* ==================================================
          HEADER
          
          IMPORTANT:
          The dropdown remains in this same horizontal
          header row as the Customer Loans heading.
      ================================================== */}

      <div style={collectionLoanSelectionStyles.loansHeader}>
        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <h2 style={collectionLoanSelectionStyles.sectionTitle}>
            Customer Loans
          </h2>

          <p style={collectionLoanSelectionStyles.sectionSubtitle}>
            Select the loan for collection
          </p>
        </div>

        {/* =================================================
            SELECTED LOAN DROPDOWN

            FINORA reference layout:
            - Top right
            - Same row as Customer Loans heading
            - Fixed compact height
            - Custom FINORA arrow
            - Does not create an extra row
        ================================================= */}

        <div style={collectionLoanSelectionStyles.loanDropdownWrapper}>
          <select
            value={selectedLoanId ?? ""}
            onChange={(event) => {
              const loan = loans.find((item) => item.id === event.target.value);

              if (loan) {
                onSelectLoan(loan);
              }
            }}
            aria-label="Select loan"
            style={collectionLoanSelectionStyles.loanDropdown}
          >
            {loans.map((loan) => (
              <option key={loan.id} value={loan.id}>
                {loan.loanNumber}
              </option>
            ))}
          </select>

          <span
            aria-hidden="true"
            style={collectionLoanSelectionStyles.loanDropdownArrow}
          >
            ▾
          </span>
        </div>
      </div>

      {/* ==================================================
          LOAN CARDS
      ================================================== */}

      <div style={collectionLoanSelectionStyles.loanCardsGrid}>
        {loans.map((loan) => {
          const isSelected = loan.id === selectedLoanId;

          const cardStyle: CSSProperties = {
            ...collectionLoanSelectionStyles.loanCard,

            ...(isSelected
              ? collectionLoanSelectionStyles.loanCardSelected
              : {}),
          };

          const statusStyle: CSSProperties = {
            ...collectionLoanSelectionStyles.loanStatus,

            ...(isSelected
              ? collectionLoanSelectionStyles.loanStatusSelected
              : {}),
          };

          return (
            <button
              key={loan.id}
              type="button"
              onClick={() => onSelectLoan(loan)}
              aria-pressed={isSelected}
              style={cardStyle}
            >
              <span style={collectionLoanSelectionStyles.loanCardNumber}>
                {loan.loanNumber}
              </span>

              <span style={collectionLoanSelectionStyles.loanCardAmount}>
                {formatCurrency(loan.amount)}
              </span>

              <span
                style={collectionLoanSelectionStyles.loanCardType}
                title={loan.repaymentType}
              >
                {loan.repaymentType}
              </span>

              <span style={statusStyle}>{loan.status}</span>
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
