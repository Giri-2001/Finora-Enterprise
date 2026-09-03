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
// - Show remaining principal due
// - Show current authoritative loan outstanding
// - Calculate accrued interest from loan date
// - Show late fee / penalty
// - Show generated total
// - React immediately to successful collection updates
// - Keep calculated values locked from manual editing
//
// IMPORTANT
//
// - Original principal comes from reviewData.loanAmount.
// - Current collectible balance comes from
//   reviewData.outstandingBalance.
// - Previous collections come only through CollectionService.
// - No repository access.
// - No StorageManager access.
// - No localStorage access.
// - No EMI schedule calculation here.
// - No duplicate financial persistence.
//
// PRINCIPAL DUE RULE
//
// Principal Due is:
//
//   original principal
//   - cumulative collections received
//
// Example:
//
//   Original Principal = ₹15,000
//   Collected          = ₹900
//
//   Principal Due      = ₹14,100
//
// Principal Due can never go below zero.
//
// GENERATED TOTAL RULE
//
// Generated Total follows the authoritative current Loan
// outstanding balance.
//
// Example:
//
//   Original collectible outstanding = ₹16,550
//   Collection                       = ₹900
//
//   Generated Total                  = ₹15,650
//
// Therefore:
//
//   Principal Due
//
// and:
//
//   Generated Total
//
// intentionally represent different financial concepts.
//
// ACCRUED INTEREST
//
// Accrued interest is informational and is calculated from the
// remaining principal due using the monthly flat-interest rate
// and elapsed calendar days.
//
// It is NOT added again to Generated Total because the current
// authoritative Loan outstanding already represents the
// persisted collectible balance.
//
// CLOSED LOAN
//
// When current outstanding becomes zero:
//
//   Principal Due      = ₹0
//   Accrued Interest   = ₹0
//   Late Fee / Penalty = ₹0
//   Generated Total    = ₹0
//
// LIVE REFRESH
//
// PaymentDetails dispatches:
//
//   FINORA_LOAN_UPDATED
//   FINORA_COLLECTION_UPDATED
//
// after persistence.
//
// This component reloads cumulative collection history through
// CollectionService when either event fires.
//
// ICON STANDARD
//
// - Lucide React icons only
// - No emoji icons
// - No image icons
// - No local colour palette
// - Icon colours come from FINORA Theme Engine
//
// VERSION : 2.3
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import { useEffect, useState } from "react";

import { LockKeyhole } from "lucide-react";

import { useResponsive } from "../../../utils/responsive";

import { createCollectionSystemFinancialListStyle } from "../../../utils/responsive/collections/collectionStudio.layout";

import { collectionSystemGeneratedStyles } from "./CollectionSystemGenerated.styles";

import { useCollectionController } from "../controller";

import { loadCollections } from "../../../services/collection/collectionService";

import { formatCurrency } from "../../../utils/currency/formatCurrency";

// ============================================================
// HELPERS
// ============================================================

/**
 * FINORA financial rounding rule.
 *
 * Examples:
 *
 * 13.49 -> 13
 * 13.50 -> 14
 * 13.51 -> 14
 */
function roundFinancialValue(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.round(value);
}

/**
 * Convert an unknown value into a safe, non-negative,
 * finite financial number.
 */
function safeFinancialNumber(value: unknown): number {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

/**
 * Determine whether the controller contains a genuine
 * authoritative outstanding value.
 *
 * IMPORTANT:
 *
 * Zero is valid.
 *
 * Zero means the Loan has been fully settled and MUST NOT
 * cause fallback to the original principal.
 */
function hasAuthoritativeOutstanding(value: unknown): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0;
}

/**
 * Convert persisted dates into local calendar dates without
 * allowing timezone conversion to move the intended date.
 */
function parseCalendarDate(value: string): Date | null {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  // ==========================================================
  // YYYY-MM-DD
  // ==========================================================

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);

    const month = Number(dateOnlyMatch[2]);

    const day = Number(dateOnlyMatch[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  // ==========================================================
  // ISO / DEFENSIVE FALLBACK
  // ==========================================================

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/**
 * Return elapsed calendar days between the Loan Business Date
 * and the active Collection Business Date.
 *
 * The end date must come from the authenticated Login Date.
 * The device clock must never control operational calculations.
 *
 * Same Business Date:
 *
 *   0 days
 *
 * Previous day → Collection Business Date:
 *
 *   1 day
 *
 * Collection date before Loan date:
 *
 *   0 days
 */
function getElapsedLoanDays(
  loanDateValue: string,
  collectionBusinessDateValue: string,
): number {
  const loanDate =
    parseCalendarDate(
      loanDateValue,
    );

  const collectionBusinessDate =
    parseCalendarDate(
      collectionBusinessDateValue,
    );

  if (
    !loanDate ||
    !collectionBusinessDate
  ) {
    return 0;
  }

  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  const difference =
    collectionBusinessDate.getTime() -
    loanDate.getTime();

  if (difference <= 0) {
    return 0;
  }

  return Math.floor(
    difference /
      millisecondsPerDay,
  );
}

/**
 * FINORA monthly flat-interest informational calculation.
 *
 * Remaining Principal Due is used as the current interest
 * basis.
 */
function calculateAccruedInterest(
  principalDue: number,
  monthlyInterestRate: number,
  elapsedDays: number,
): number {
  if (!Number.isFinite(principalDue) || principalDue <= 0) {
    return 0;
  }

  if (!Number.isFinite(monthlyInterestRate) || monthlyInterestRate <= 0) {
    return 0;
  }

  if (!Number.isFinite(elapsedDays) || elapsedDays <= 0) {
    return 0;
  }

  const monthlyInterest = principalDue * (monthlyInterestRate / 100);

  const dailyInterest = monthlyInterest / 30;

  const accruedInterest = dailyInterest * elapsedDays;

  return roundFinancialValue(accruedInterest);
}

// ============================================================
// COMPONENT
// ============================================================

export default function CollectionSystemGenerated() {
  const { reviewData } = useCollectionController();

  // ==========================================================
  // FINORA RESPONSIVE ENGINE
  // ==========================================================

  const { viewport } = useResponsive();

  const responsiveFinancialListStyle = {
    ...collectionSystemGeneratedStyles.financialList,

    ...createCollectionSystemFinancialListStyle(viewport),
  };

  // ==========================================================
  // CUMULATIVE COLLECTIONS
  // ==========================================================
  //
  // CollectionService is the authoritative service boundary.
  //
  // Example:
  //
  // Collection 1 = ₹450
  // Collection 2 = ₹450
  //
  // totalCollected = ₹900
  //
  // ==========================================================

  const [totalCollected, setTotalCollected] = useState(0);

  // ==========================================================
  // LOAD CUMULATIVE COLLECTIONS
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loanId = String(reviewData.loanId ?? "").trim();

    // ========================================================
    // LOAD CURRENT LOAN COLLECTION TOTAL
    // ========================================================

    async function refreshCollectedAmount(): Promise<void> {
      if (!loanId) {
        if (!cancelled) {
          setTotalCollected(0);
        }

        return;
      }

      try {
        const collections = await loadCollections();

        if (cancelled) {
          return;
        }

        const collected = collections.reduce((total, collection) => {
          if (String(collection.loanId ?? "") !== loanId) {
            return total;
          }

          return total + safeFinancialNumber(collection.paymentAmount);
        }, 0);

        setTotalCollected(roundFinancialValue(collected));
      } catch (error) {
        console.error(
          "FINORA SYSTEM GENERATED COLLECTION TOTAL LOAD ERROR:",
          error,
        );

        if (!cancelled) {
          setTotalCollected(0);
        }
      }
    }

    // ========================================================
    // INITIAL LOAD
    // ========================================================

    void refreshCollectedAmount();

    // ========================================================
    // LIVE REFRESH
    // ========================================================

    function handleFinancialRefresh(): void {
      void refreshCollectedAmount();
    }

    window.addEventListener("FINORA_LOAN_UPDATED", handleFinancialRefresh);

    window.addEventListener(
      "FINORA_COLLECTION_UPDATED",
      handleFinancialRefresh,
    );

    return () => {
      cancelled = true;

      window.removeEventListener("FINORA_LOAN_UPDATED", handleFinancialRefresh);

      window.removeEventListener(
        "FINORA_COLLECTION_UPDATED",
        handleFinancialRefresh,
      );
    };
  }, [reviewData.loanId]);

  // ==========================================================
  // ORIGINAL PRINCIPAL
  // ==========================================================
  //
  // This is ALWAYS Loan.amount.
  //
  // Example:
  //
  // Loan Principal = ₹15,000
  //
  // It must never initially display:
  //
  // ₹16,550
  //
  // because ₹16,550 is the collectible outstanding balance,
  // not the original principal.
  //
  // ==========================================================

  const originalPrincipal = roundFinancialValue(
    safeFinancialNumber(reviewData.loanAmount),
  );

  // ==========================================================
  // AUTHORITATIVE CURRENT OUTSTANDING
  // ==========================================================

  const currentOutstanding = roundFinancialValue(
    hasAuthoritativeOutstanding(reviewData.outstandingBalance)
      ? safeFinancialNumber(reviewData.outstandingBalance)
      : originalPrincipal,
  );

  // ==========================================================
  // CLOSED LOAN
  // ==========================================================

  const loanClosed = currentOutstanding <= 0;

  // ==========================================================
  // PRINCIPAL DUE
  // ==========================================================
  //
  // Required FINORA behaviour:
  //
  // Original Principal
  // -
  // Cumulative Collections
  //
  // Example:
  //
  // ₹15,000
  // - ₹900
  // --------
  // ₹14,100
  //
  // When the persisted Loan outstanding reaches zero,
  // Principal Due is forced to zero.
  //
  // ==========================================================

  const principalDue = loanClosed
    ? 0
    : roundFinancialValue(Math.max(0, originalPrincipal - totalCollected));

  // ==========================================================
  // MONTHLY INTEREST RATE
  // ==========================================================

  const monthlyInterestRate = safeFinancialNumber(reviewData.loanInterestRate);

  // ==========================================================
  // ELAPSED DAYS
  // ==========================================================

  const elapsedDays =
    getElapsedLoanDays(
      reviewData.loanDate,
      reviewData.receiptDate,
    );

  // ==========================================================
  // ACCRUED INTEREST
  // ==========================================================
  //
  // Informational calculation only.
  //
  // IMPORTANT:
  //
  // This amount is NOT added again to Generated Total because
  // currentOutstanding already represents the authoritative
  // persisted collectible Loan balance.
  //
  // ==========================================================

  const accruedInterest = loanClosed
    ? 0
    : calculateAccruedInterest(principalDue, monthlyInterestRate, elapsedDays);

  // ==========================================================
  // LATE FEE
  // ==========================================================

  const lateFee = loanClosed
    ? 0
    : roundFinancialValue(safeFinancialNumber(reviewData.penaltyAmount));

  // ==========================================================
  // GENERATED TOTAL
  // ==========================================================
  //
  // AUTHORITATIVE CURRENT OUTSTANDING.
  //
  // Example:
  //
  // Initial outstanding = ₹16,550
  //
  // Collection = ₹900
  //
  // Generated Total = ₹15,650
  //
  // ==========================================================

  const generatedTotal = loanClosed ? 0 : currentOutstanding;

  // ==========================================================
  // CURRENCY
  // ==========================================================

  function currency(value: number): string {
    return `₹ ${formatCurrency(roundFinancialValue(value))}`;
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
          <LockKeyhole
            aria-hidden="true"
            style={collectionSystemGeneratedStyles.lock}
            size={24}
            strokeWidth={2}
          />

          <div>
            <h2 style={collectionSystemGeneratedStyles.title}>
              System (Auto Calculated)
            </h2>
          </div>
        </div>
      </header>

      {/* ====================================================
          FINANCIAL VALUES
      ==================================================== */}

      <div style={responsiveFinancialListStyle}>
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
            Interest - till collection date
          </span>

          <strong style={collectionSystemGeneratedStyles.financialValue}>
            {currency(accruedInterest)}
          </strong>
        </div>

        {/* ==================================================
            INTEREST BASIS
        ================================================== */}

        <div style={collectionSystemGeneratedStyles.financialRow}>
          <span style={collectionSystemGeneratedStyles.financialLabel}>
            Interest Basis
          </span>

          <strong style={collectionSystemGeneratedStyles.financialValue}>
            {monthlyInterestRate}% × {elapsedDays} day
            {elapsedDays === 1 ? "" : "s"}
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
    </section>
  );
}

// ============================================================
// END
// ============================================================
