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
// - Show actual principal due
// - Calculate accrued interest from loan date
// - Show late fee / penalty
// - Show generated total
// - Clearly communicate that values are auto calculated
// - Keep calculated values locked from manual editing
//
// IMPORTANT
//
// - EMI amount is NOT used here.
// - Repayment frequency is NOT used here.
// - todayDue is NOT used as accrued interest.
// - Loan.amount is the principal basis.
// - Loan.interest is the monthly flat interest percentage.
// - Loan.loanDate is the interest start date.
// - Interest is calculated only for elapsed days.
// - Monthly basis = 30 days.
// - Every financial result is rounded to the nearest rupee.
// - .49 and below rounds down.
// - .50 and above rounds up.
//
// FORMULA
//
// accruedInterest
//   = principal
//     × monthlyInterestRate
//     ÷ 100
//     × elapsedDays
//     ÷ 30
//
// generatedTotal
//   = principalDue
//     + accruedInterest
//     + lateFee
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
 *
 * Math.round follows the required FINORA rule for
 * positive financial amounts.
 */
function roundFinancialValue(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.round(value);
}

/**
 * Convert a stored date into a local calendar date
 * without allowing the JavaScript timezone conversion
 * to shift the intended loan date.
 *
 * Supported input:
 *
 * YYYY-MM-DD
 *
 * ISO date strings are also supported defensively.
 */
function parseCalendarDate(value: string): Date | null {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

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

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/**
 * Return elapsed calendar days between loan date
 * and today.
 *
 * Same-day loan:
 *   0 days
 *
 * Yesterday → today:
 *   1 day
 *
 * Future loan date:
 *   0 days
 *
 * The calculation intentionally ignores time-of-day.
 */
function getElapsedLoanDays(loanDateValue: string): number {
  const loanDate = parseCalendarDate(loanDateValue);

  if (!loanDate) {
    return 0;
  }

  const today = new Date();

  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  const difference = todayDate.getTime() - loanDate.getTime();

  if (difference <= 0) {
    return 0;
  }

  return Math.floor(difference / millisecondsPerDay);
}

/**
 * FINORA flat monthly interest calculation.
 *
 * Monthly interest percentage is converted into
 * a daily amount using a 30-day month.
 */
function calculateAccruedInterest(
  principal: number,
  monthlyInterestRate: number,
  elapsedDays: number,
): number {
  if (!Number.isFinite(principal) || principal <= 0) {
    return 0;
  }

  if (!Number.isFinite(monthlyInterestRate) || monthlyInterestRate <= 0) {
    return 0;
  }

  if (!Number.isFinite(elapsedDays) || elapsedDays <= 0) {
    return 0;
  }

  const monthlyInterest = principal * (monthlyInterestRate / 100);

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
  // AUTHORITATIVE LOAN VALUES
  // ==========================================================
  //
  // IMPORTANT:
  //
  // principal = original Loan.amount
  //
  // NOT:
  //
  // outstandingBalance
  // todayDue
  // EMI amount
  // schedule amount
  //
  // ==========================================================

  const principalDue = roundFinancialValue(Number(reviewData.loanAmount ?? 0));

  const monthlyInterestRate = Number(reviewData.loanInterestRate ?? 0);

  const elapsedDays = getElapsedLoanDays(reviewData.loanDate);

  // ==========================================================
  // ACCRUED INTEREST
  // ==========================================================
  //
  // Formula:
  //
  // Principal
  // × Monthly Interest %
  // ÷ 100
  // × Days
  // ÷ 30
  //
  // Rounded using FINORA financial rounding.
  //
  // ==========================================================

  const accruedInterest = calculateAccruedInterest(
    principalDue,
    monthlyInterestRate,
    elapsedDays,
  );

  // ==========================================================
  // LATE FEE
  // ==========================================================

  const lateFee = roundFinancialValue(Number(reviewData.penaltyAmount ?? 0));

  // ==========================================================
  // GENERATED TOTAL
  // ==========================================================
  //
  // Principal + accrued interest + late fee.
  //
  // Discount / payment amount are intentionally NOT
  // subtracted here because this is the system-generated
  // gross collection amount.
  //
  // ==========================================================

  const generatedTotal = roundFinancialValue(
    principalDue + accruedInterest + lateFee,
  );

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
          <span aria-hidden="true" style={collectionSystemGeneratedStyles.lock}>
            🔒
          </span>

          <div>
            <h2 style={collectionSystemGeneratedStyles.title}>
              3. System Generated (Auto Calculated)
            </h2>

            <div style={collectionSystemGeneratedStyles.subtitle}>
              Calculated automatically from the original loan principal, loan
              interest terms and elapsed days.
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
            INTEREST CALCULATION INFORMATION
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
            Principal is based on the actual loan amount. Interest is calculated
            from the loan date through today using the monthly flat-interest
            rule. EMI amount is not used.
          </span>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================
