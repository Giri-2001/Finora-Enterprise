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
// Outstanding Balance follows the authoritative current Loan
// outstanding balance.
//
// Example:
//
//   Original collectible outstanding = ₹16,550
//   Collection                       = ₹900
//
//   Outstanding Balance                  = ₹15,650
//
// Therefore:
//
//   Principal Due
//
// and:
//
//   Outstanding Balance
//
// intentionally represent different financial concepts.
//
// ACCRUED INTEREST
//
// Accrued interest is informational and is calculated from the
// remaining principal due using the monthly flat-interest rate
// and elapsed calendar days.
//
// It is NOT added again to Outstanding Balance because the current
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
//   Outstanding Balance    = ₹0
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

import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

import { LockKeyhole } from "lucide-react";

import { useResponsive } from "../../../utils/responsive";

import { createCollectionSystemFinancialListStyle } from "../../../utils/responsive/collections/collectionStudio.layout";

import { collectionSystemGeneratedStyles } from "./CollectionSystemGenerated.styles";

import { useCollectionController } from "../controller";

import {
  fetchLoan,
  fetchLoanContractualInterest,
  fetchLoanPrincipalDue,
} from "../../../services/loan/loanService";

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
 * Previous day â†’ Collection Business Date:
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


type PremiumCycleInstallment = {
  dueDate: string;
  installmentAmount: number;
  interestAmount: number;
  paidAmount: number;
  waivedAmount: number;
  penaltyAmount: number;
  status: string;
};

type PremiumScheduleMeta = {
  finalDueDate: string;
  cycleDay: number;
  lateFee: number;
  rows: PremiumCycleInstallment[];
};

function readPersistedScheduleRows(
  loan: unknown,
): Array<Record<string, unknown>> {
  if (!loan || typeof loan !== "object") {
    return [];
  }

  const record =
    loan as Record<string, unknown>;

  const candidates = [
    record.schedule,
    record.emiSchedule,
    record.installments,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (
          row,
        ): row is Record<string, unknown> =>
          Boolean(
            row &&
              typeof row === "object",
          ),
      );
    }
  }

  return [];
}

function resolvePremiumScheduleMeta(
  loan: unknown,
): PremiumScheduleMeta | null {
  if (!loan || typeof loan !== "object") {
    return null;
  }

  const record =
    loan as Record<string, unknown>;

  const rows =
    readPersistedScheduleRows(loan);

  const normalizedRows = rows
    .map((row) => {
      const date = parseCalendarDate(
        String(row.dueDate ?? row.date ?? row.installmentDate ?? ""),
      );
      const interestAmount = Number(row.interestAmount);
      const installmentAmount = Number(row.installmentAmount);
      if (
        !date ||
        !Number.isFinite(interestAmount) || interestAmount < 0 ||
        !Number.isFinite(installmentAmount) || installmentAmount <= 0
      ) {
        return null;
      }
      return {
        dueDate: [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, "0"),
          String(date.getDate()).padStart(2, "0"),
        ].join("-"),
        installmentAmount,
        interestAmount,
        paidAmount: safeFinancialNumber(row.paidAmount),
        waivedAmount: safeFinancialNumber(row.waivedAmount),
        penaltyAmount: safeFinancialNumber(row.penaltyAmount),
        status: String(row.status ?? "Pending").trim().toLowerCase(),
      };
    });

  // Do not publish a customer-facing settlement figure from partial data.
  if (normalizedRows.some((row) => row === null)) {
    const dates = rows
      .map((row) => parseCalendarDate(
        String(row.dueDate ?? row.date ?? row.installmentDate ?? ""),
      ))
      .filter((date): date is Date => date !== null)
      .sort((left, right) => left.getTime() - right.getTime());
    if (dates.length === 0) {
      return null;
    }
    return {
      finalDueDate: formatCalendarKey(dates[dates.length - 1]),
      cycleDay: Math.max(...dates.map((date) => date.getDate())),
      lateFee: safeFinancialNumber(record.lateFee),
      rows: [],
    };
  }

  const sortedRows = normalizedRows
    .filter((row): row is PremiumCycleInstallment => row !== null)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));

  if (sortedRows.length > 0) {
    const finalRow = sortedRows[sortedRows.length - 1];
    const cycleDay = Math.max(
      ...sortedRows.map((row) => Number(row.dueDate.slice(8, 10))),
    );
    return {
      finalDueDate: finalRow.dueDate,
      cycleDay,
      lateFee: safeFinancialNumber(record.lateFee),
      rows: sortedRows,
    };
  }

  // Legacy final EMI date remains visible, but no payoff is guessed.
  const fallbackDate = parseCalendarDate(String(record.dueDate ?? ""));
  return fallbackDate
    ? {
        finalDueDate: formatCalendarKey(fallbackDate),
        cycleDay: fallbackDate.getDate(),
        lateFee: safeFinancialNumber(record.lateFee),
        rows: [],
      }
    : null;
}

function formatCalendarKey(
  date: Date,
): string {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatPremiumDate(
  value: string,
): string {
  const date =
    parseCalendarDate(value);

  if (!date) {
    return "--";
  }

  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear(),
  ].join("/");
}

function buildPremiumCycleDate(
  year: number,
  monthIndex: number,
  requestedDay: number,
): Date {
  const maximumDay =
    new Date(
      year,
      monthIndex + 1,
      0,
    ).getDate();

  return new Date(
    year,
    monthIndex,
    Math.min(
      Math.max(1, requestedDay),
      maximumDay,
    ),
  );
}

function resolveNextPremiumCycleDate(
  businessDateValue: string,
  cycleDay: number,
): Date | null {
  const businessDate =
    parseCalendarDate(
      businessDateValue,
    );

  if (
    !businessDate ||
    !Number.isFinite(cycleDay) ||
    cycleDay <= 0
  ) {
    return null;
  }

  let candidate =
    buildPremiumCycleDate(
      businessDate.getFullYear(),
      businessDate.getMonth(),
      cycleDay,
    );

  /*
   * "Next Cycle" always means the upcoming cycle.
   * If today itself is the collection day, move to next month.
   */
  if (
    candidate.getTime() <=
    businessDate.getTime()
  ) {
    candidate =
      buildPremiumCycleDate(
        businessDate.getMonth() === 11
          ? businessDate.getFullYear() + 1
          : businessDate.getFullYear(),
        businessDate.getMonth() === 11
          ? 0
          : businessDate.getMonth() + 1,
        cycleDay,
      );
  }

  return candidate;
}

/**
 * Read-only cycle payoff for the single "Close By Next Cycle" card.
 * The selected business date is inclusive of the current due date.
 * Interest is taken from persisted EMI rows, not daily accrual.
 * Penalty rows already carrying a recorded penalty are historical
 * collections, not a second unpaid charge.
 */
function calculateCycleCloseAmount(
  meta: PremiumScheduleMeta | null,
  businessDateValue: string,
  principalDue: number,
  monthlyInterestRate: number,
): number | null {
  const businessDate = parseCalendarDate(businessDateValue);
  if (!meta || !businessDate || meta.rows.length === 0) {
    return null;
  }

  const businessKey = formatCalendarKey(businessDate);
  const nextDue = meta.rows.find((row) => row.dueDate >= businessKey);
  let closingDueKey = nextDue?.dueDate ?? meta.finalDueDate;
  let additionalCycles = 0;

  if (!nextDue) {
    let cursor = parseCalendarDate(meta.finalDueDate);
    if (!cursor) {
      return null;
    }
    while (closingDueKey < businessKey && additionalCycles < 1200) {
      const nextMonth = cursor.getMonth() + 1;
      cursor = buildPremiumCycleDate(
        cursor.getFullYear() + Math.floor(nextMonth / 12),
        nextMonth % 12,
        meta.cycleDay,
      );
      closingDueKey = formatCalendarKey(cursor);
      additionalCycles += 1;
    }
    if (closingDueKey < businessKey) {
      return null;
    }
  }

  // Authoritative principal due already reflects principal repayments.
  // Within each installment, treat interest as settled first;
  // never subtract the same EMI cash again from principal due.
  const interestSettled = meta.rows.reduce(
    (sum, row) => sum + Math.min(
      row.interestAmount,
      row.paidAmount + row.waivedAmount,
    ),
    0,
  );
  const scheduledInterest = meta.rows
    .filter((row) => row.dueDate <= closingDueKey)
    .reduce((sum, row) => sum + row.interestAmount, 0);
  const extendedInterest = additionalCycles * roundFinancialValue(
    principalDue * monthlyInterestRate / 100,
  );
  const unpaidInterest = Math.max(
    0,
    scheduledInterest + extendedInterest - interestSettled,
  );

  // Only *missed and not settled* installments incur a new penalty.
  // A positive persisted penaltyAmount is evidence of an already
  // recorded penalty, and must not be charged a second time.
  const unpaidPenaltyCount = meta.rows.filter((row) =>
    row.dueDate < businessKey &&
    row.paidAmount + row.waivedAmount < row.installmentAmount &&
    row.penaltyAmount <= 0 &&
    row.status !== "overdue paid" &&
    row.status !== "paid" &&
    row.status !== "preclosed"
  ).length;
  const extendedMissedCycles = Math.max(0, additionalCycles - 1);
  const estimatedUnpaidPenalty =
    (unpaidPenaltyCount + extendedMissedCycles) * meta.lateFee;

  return roundFinancialValue(
    principalDue + unpaidInterest + estimatedUnpaidPenalty,
  );
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

    // FINORA_AP03_R005_ANDROID_MOBILE_FINANCIAL_GRID
    // Android phone: eight cards in four rows, two per row.
    // Windows and tablet geometry remains unchanged.
    ...(Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android" &&
    viewport === "mobile"
      ? {
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }
      : {}),
  };

  // ==========================================================
  // AUTHORITATIVE PRINCIPAL DUE
  // ==========================================================
  //
  // Principal Due is resolved through LoanService from the
  // persisted contractual Loan schedule.
  //
  // IMPORTANT:
  //
  // - Total cash collections are NOT principal repayment.
  // - Interest payments do NOT reduce principal.
  // - Penalty / late fee does NOT reduce principal.
  // - Principal reduces only when the persisted schedule shows
  //   actual payment against a principal component.
  //
  // ==========================================================

  const [
    authoritativePrincipalDue,
    setAuthoritativePrincipalDue,
  ] = useState<number | null>(null);

  const [
    contractualInterestCap,
    setContractualInterestCap,
  ] = useState<number | null>(null);

  // ==========================================================
  // LOAD AUTHORITATIVE PRINCIPAL DUE
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loanId =
      String(reviewData.loanId ?? "").trim();

    async function refreshPrincipalDue(): Promise<void> {
      if (!loanId) {
        if (!cancelled) {
          setAuthoritativePrincipalDue(null);
          setContractualInterestCap(null);
        }

        return;
      }

      try {
        const [
          principalDue,
          contractualInterest,
        ] = await Promise.all([
          fetchLoanPrincipalDue(loanId),
          fetchLoanContractualInterest(loanId),
        ]);

        if (cancelled) {
          return;
        }

        setAuthoritativePrincipalDue(
          typeof principalDue === "number" &&
          Number.isFinite(principalDue)
            ? principalDue
            : null,
        );

        setContractualInterestCap(
          typeof contractualInterest === "number" &&
          Number.isFinite(contractualInterest)
            ? Math.max(0, contractualInterest)
            : null,
        );
      } catch (error) {
        console.error(
          "FINORA PRINCIPAL DUE REFRESH FAILED:",
          error,
        );

        if (!cancelled) {
          setAuthoritativePrincipalDue(null);
          setContractualInterestCap(null);
        }
      }
    }

    void refreshPrincipalDue();

    function handleFinancialRefresh(): void {
      void refreshPrincipalDue();
    }

    window.addEventListener(
      "FINORA_LOAN_UPDATED",
      handleFinancialRefresh,
    );

    window.addEventListener(
      "FINORA_COLLECTION_UPDATED",
      handleFinancialRefresh,
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "FINORA_LOAN_UPDATED",
        handleFinancialRefresh,
      );

      window.removeEventListener(
        "FINORA_COLLECTION_UPDATED",
        handleFinancialRefresh,
      );
    };
  }, [reviewData.loanId]);


  // ==========================================================
  // PREMIUM READ-ONLY SCHEDULE SNAPSHOT
  // ==========================================================
  //
  // IMPORTANT:
  //
  // - Read only.
  // - No Loan mutation.
  // - No Collection mutation.
  // - No schedule generation.
  // - No persistence.
  //
  // Used only for:
  //
  //   Final EMI Date
  //   Close Today
  //   Close By Next Cycle
  //   Discount Eligible
  //   Overdue Interest
  //
  // ==========================================================

  const [
    premiumScheduleMeta,
    setPremiumScheduleMeta,
  ] =
    useState<PremiumScheduleMeta | null>(
      null,
    );

  useEffect(() => {
    let cancelled = false;

    const loanId =
      String(
        reviewData.loanId ?? "",
      ).trim();

    async function refreshPremiumSchedule(): Promise<void> {
      if (!loanId) {
        if (!cancelled) {
          setPremiumScheduleMeta(null);
        }

        return;
      }

      try {
        const loan =
          await fetchLoan(
            loanId,
          );

        if (cancelled) {
          return;
        }

        setPremiumScheduleMeta(
          resolvePremiumScheduleMeta(
            loan,
          ),
        );
      } catch (error) {
        console.error(
          "PAISARULE PREMIUM SCHEDULE REFRESH FAILED:",
          error,
        );

        if (!cancelled) {
          setPremiumScheduleMeta(null);
        }
      }
    }

    void refreshPremiumSchedule();

    function handlePremiumRefresh(): void {
      void refreshPremiumSchedule();
    }

    window.addEventListener(
      "FINORA_LOAN_UPDATED",
      handlePremiumRefresh,
    );

    window.addEventListener(
      "FINORA_COLLECTION_UPDATED",
      handlePremiumRefresh,
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "FINORA_LOAN_UPDATED",
        handlePremiumRefresh,
      );

      window.removeEventListener(
        "FINORA_COLLECTION_UPDATED",
        handlePremiumRefresh,
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
    : roundFinancialValue(
        authoritativePrincipalDue !== null
          ? authoritativePrincipalDue
          : originalPrincipal,
      );

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
  // This amount is NOT added again to Outstanding Balance because
  // currentOutstanding already represents the authoritative
  // persisted collectible Loan balance.
  //
  // ==========================================================

  const rawAccruedInterest = loanClosed
    ? 0
    : calculateAccruedInterest(
        principalDue,
        monthlyInterestRate,
        elapsedDays,
      );

  const accruedInterest = loanClosed
    ? 0
    : roundFinancialValue(
        contractualInterestCap !== null
          ? Math.min(
              rawAccruedInterest,
              contractualInterestCap,
            )
          : rawAccruedInterest,
      );

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
  // Outstanding Balance = ₹15,650
  //
  // ==========================================================

  const generatedTotal = loanClosed ? 0 : currentOutstanding;


  // ==========================================================
  // PREMIUM COLLECTION INTELLIGENCE
  // ==========================================================
  //
  // Existing FINORA accounting values above remain untouched.
  //
  // These values are projection-only and never persist.
  //
  // ==========================================================

  const finalEmiDate =
    premiumScheduleMeta?.finalDueDate ??
    "";

  const nextCycleDate =
    premiumScheduleMeta
      ? resolveNextPremiumCycleDate(
          reviewData.receiptDate,
          premiumScheduleMeta.cycleDay,
        )
      : null;

  const nextCycleDateKey =
    nextCycleDate
      ? formatCalendarKey(
          nextCycleDate,
        )
      : "";

  /*
   * Contract interest that has not yet been earned.
   *
   * Existing Outstanding includes the contractual collectible
   * balance, so this future portion is the potential concession
   * available for an early close.
   */
  const unearnedInterestToday =
    loanClosed ||
    contractualInterestCap === null
      ? 0
      : Math.max(
          0,
          contractualInterestCap -
            accruedInterest,
        );

  /*
   * Overdue Interest begins only AFTER the final scheduled EMI.
   *
   * It intentionally does not stop merely because the original
   * schedule has matured.
   *
   * It stops only when the authoritative Loan is closed.
   */
  const overdueDaysToday =
    loanClosed ||
    !finalEmiDate
      ? 0
      : getElapsedLoanDays(
          finalEmiDate,
          reviewData.receiptDate,
        );

  const overdueInterest =
    loanClosed
      ? 0
      : calculateAccruedInterest(
          principalDue,
          monthlyInterestRate,
          overdueDaysToday,
        );

  /*
   * CLOSE TODAY
   *
   * Current authoritative contractual balance
   * - future / unearned contractual interest
   * + post-maturity overdue interest.
   */
  const minimumCloseToday =
    loanClosed
      ? 0
      : roundFinancialValue(
          principalDue +
            overdueInterest +
            lateFee,
        );

  const closeToday =
    loanClosed
      ? 0
      : roundFinancialValue(
          Math.max(
            minimumCloseToday,
            currentOutstanding -
              unearnedInterestToday +
              overdueInterest,
          ),
        );

  /*
   * DISCOUNT ELIGIBLE
   *
   * Discount may remove only the future / unearned collectible
   * portion. It must never reduce the authoritative Principal Due
   * or applicable overdue / penalty amount.
   */
  const discountEligible =
    loanClosed
      ? 0
      : roundFinancialValue(
          Math.max(
            0,
            currentOutstanding -
              closeToday,
          ),
        );

  const projectedElapsedDays =
    loanClosed ||
    !nextCycleDateKey
      ? elapsedDays
      : getElapsedLoanDays(
          reviewData.loanDate,
          nextCycleDateKey,
        );

  const projectedRawContractInterest =
    loanClosed
      ? 0
      : calculateAccruedInterest(
          principalDue,
          monthlyInterestRate,
          projectedElapsedDays,
        );

  const projectedContractInterest =
    loanClosed
      ? 0
      : contractualInterestCap !== null
        ? Math.min(
            projectedRawContractInterest,
            contractualInterestCap,
          )
        : projectedRawContractInterest;

  const projectedUnearnedInterest =
    loanClosed ||
    contractualInterestCap === null
      ? 0
      : Math.max(
          0,
          contractualInterestCap -
            projectedContractInterest,
        );

  const projectedOverdueDays =
    loanClosed ||
    !finalEmiDate ||
    !nextCycleDateKey
      ? 0
      : getElapsedLoanDays(
          finalEmiDate,
          nextCycleDateKey,
        );

  const projectedOverdueInterest =
    loanClosed
      ? 0
      : calculateAccruedInterest(
          principalDue,
          monthlyInterestRate,
          projectedOverdueDays,
        );

  /*
   * CLOSE BY NEXT CYCLE
   *
   * The next cycle keeps moving month-by-month even after the
   * original final EMI date.
   */
  const calculatedCycleClose = loanClosed
    ? 0
    : calculateCycleCloseAmount(
        premiumScheduleMeta,
        reviewData.receiptDate,
        principalDue,
        monthlyInterestRate,
      );

  // No fallback to daily accrual when EMI schedule is unavailable.
  const closeByNextCycle = calculatedCycleClose;

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
            Interest Generated
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

        {/* ==================================================
            CLOSE TODAY
        ================================================== */}

        <div style={collectionSystemGeneratedStyles.financialRow}>
          <span style={collectionSystemGeneratedStyles.financialLabel}>
            Close Today
          </span>

          <strong style={collectionSystemGeneratedStyles.financialValue}>
            {currency(closeToday)}
          </strong>
        </div>

        {/* ==================================================
            CLOSE BY NEXT CYCLE
        ================================================== */}

        <div style={collectionSystemGeneratedStyles.financialRow}>
          <span style={collectionSystemGeneratedStyles.financialLabel}>
            EMI Cycle Closure
          </span>

          <strong style={collectionSystemGeneratedStyles.financialValue}>
            {closeByNextCycle === null ? "--" : currency(closeByNextCycle)}
          </strong>
        </div>

        {/* ==================================================
            DISCOUNT ELIGIBLE
        ================================================== */}

        <div style={collectionSystemGeneratedStyles.financialRow}>
          <span style={collectionSystemGeneratedStyles.financialLabel}>
            Discount Eligible
          </span>

          <strong style={collectionSystemGeneratedStyles.financialValue}>
            {currency(discountEligible)}
          </strong>
        </div>

        {/* ==================================================
            OVERDUE INTEREST
        ================================================== */}

        <div style={collectionSystemGeneratedStyles.financialRow}>
          <span style={collectionSystemGeneratedStyles.financialLabel}>
            Overdue Interest
          </span>

          <strong style={collectionSystemGeneratedStyles.financialValue}>
            {currency(overdueInterest)}
          </strong>
        </div>
      </div>

      {/* ====================================================
          GENERATED TOTAL
      ==================================================== */}

      <div style={collectionSystemGeneratedStyles.generatedTotal}>
        <span style={collectionSystemGeneratedStyles.generatedTotalLabel}>
          Outstanding Balance
        </span>

        <div
          style={{
            display: "grid",
            justifyItems: "end",
            gap: "6px",
          }}
        >
          <strong style={collectionSystemGeneratedStyles.generatedTotalValue}>
            {currency(generatedTotal)}
          </strong>

          <span style={collectionSystemGeneratedStyles.generatedTotalLabel}>
            Final EMI: {formatPremiumDate(finalEmiDate)}
          </span>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// END
// ============================================================


