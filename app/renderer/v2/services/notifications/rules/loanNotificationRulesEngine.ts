// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// LOAN NOTIFICATION RULES ENGINE
//
// RESPONSIBILITY:
//
// - Evaluate live authoritative Loan state.
// - Suppress settled / closed Loans.
// - Detect collectible installments due today.
// - Detect collectible overdue installments.
// - Detect Loan maturity.
// - Preserve canonical + legacy persisted EMI schedule support.
// - Use business-local calendar-day semantics.
//
// IMPORTANT:
//
// - No storage access.
// - No provider calls.
// - No Notification persistence.
// - No scheduler clock rules.
// - No retry rules.
// - No UI.
// - No hardcoded timezone.
// - No UTC date-substring comparison.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  Loan,
} from "../../../components/customers/office/CustomerOffice/types";

import {
  getPersistedSchedule,
} from "../../../repositories/loan/loanRepository";

import type {
  LoanScheduleInstallment,
} from "../../../repositories/loan/loanRepository";

import type {
  NotificationEventType,
  NotificationSourceReference,
} from "../../../types/notifications/notification.types";

/* ============================================================
   RULE EVENT
============================================================ */

export type LoanNotificationRuleEventType =
  Extract<
    NotificationEventType,
    "LOAN_DUE" | "LOAN_OVERDUE" | "LOAN_MATURITY"
  >;

/* ============================================================
   RULE BASIS
============================================================ */

export type LoanNotificationRuleBasis =
  | "INSTALLMENT"
  | "MATURITY";

/* ============================================================
   RULE MATCH
============================================================ */

export interface LoanNotificationRuleMatch {
  eventType: LoanNotificationRuleEventType;

  basis: LoanNotificationRuleBasis;

  source: NotificationSourceReference;

  dueAt: string;

  loanOutstanding: number;

  installmentNumbers: number[];

  installmentRemainingTotal: number;
}

/* ============================================================
   RULE ISSUE
============================================================ */

export type LoanNotificationRuleIssueCode =
  | "INVALID_EVALUATION_TIMESTAMP"
  | "INVALID_LOAN_OUTSTANDING"
  | "MISSING_CUSTOMER_ID"
  | "INVALID_LOAN_DUE_DATE"
  | "INVALID_INSTALLMENT_DUE_DATE";

export interface LoanNotificationRuleIssue {
  code: LoanNotificationRuleIssueCode;

  message: string;

  loanId: string;

  installmentNumber?: number;
}

/* ============================================================
   EVALUATION RESULT
============================================================ */

export interface LoanNotificationRuleEvaluation {
  suppressed: boolean;

  matches: LoanNotificationRuleMatch[];

  issues: LoanNotificationRuleIssue[];
}

/* ============================================================
   INTERNAL COLLECTIBLE INSTALLMENT
============================================================ */

interface CollectibleInstallment {
  installmentNumber: number;

  dueAt: string;

  calendarKey: number;

  remainingAmount: number;
}

/* ============================================================
   SAFE NUMBER
============================================================ */

function safePositiveNumber(
  value: unknown,
): number {
  const parsed =
    Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(
    0,
    parsed,
  );
}

function parseNonNegativeNumber(
  value: unknown,
): number | undefined {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return undefined;
  }

  return parsed;
}

/* ============================================================
   NORMALIZE STATUS
============================================================ */

function normalizeStatus(
  value: unknown,
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/* ============================================================
   LOCAL CALENDAR KEY
============================================================ */
//
// Persisted Loan / EMI dates are ISO timestamps.
//
// FINORA Loan creation performs calendar arithmetic using local
// Date setters before persisting with toISOString().
//
// Therefore reminder classification must reconstruct the
// business-local calendar date instead of comparing UTC date
// substrings.
//
// YYYYMMDD numeric keys are used only for calendar ordering.
// No duration arithmetic is performed with them.
//
// ============================================================

function toLocalCalendarKey(
  value: string,
): number | undefined {
  const normalized =
    String(value ?? "").trim();

  if (!normalized) {
    return undefined;
  }

  /*
   * Legacy date-only values represent a calendar date,
   * not a UTC instant.
   *
   * Handle YYYY-MM-DD explicitly so timezone conversion
   * cannot move the record into the previous/next day.
   */

  const dateOnlyMatch =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      normalized,
    );

  if (dateOnlyMatch) {
    const year =
      Number(dateOnlyMatch[1]);

    const month =
      Number(dateOnlyMatch[2]);

    const day =
      Number(dateOnlyMatch[3]);

    if (
      year < 1000 ||
      year > 9999 ||
      month < 1 ||
      month > 12 ||
      day < 1
    ) {
      return undefined;
    }

    const validationDate =
      new Date(
        year,
        month - 1,
        day,
      );

    if (
      validationDate.getFullYear() !== year ||
      validationDate.getMonth() !== month - 1 ||
      validationDate.getDate() !== day
    ) {
      return undefined;
    }

    return (
      year * 10000 +
      month * 100 +
      day
    );
  }

  const date =
    new Date(normalized);

  if (!Number.isFinite(date.getTime())) {
    return undefined;
  }

  const year =
    date.getFullYear();

  const month =
    date.getMonth() + 1;

  const day =
    date.getDate();

  return (
    year * 10000 +
    month * 100 +
    day
  );
}

/* ============================================================
   INSTALLMENT REMAINING
============================================================ */

function getInstallmentRemainingAmount(
  installment: LoanScheduleInstallment,
): number {
  const status =
    normalizeStatus(installment.status);

  if (
    status === "paid" ||
    status === "preclosed"
  ) {
    return 0;
  }

  const installmentAmount =
    safePositiveNumber(
      installment.installmentAmount,
    );

  const paidAmount =
    safePositiveNumber(
      installment.paidAmount,
    );

  return Math.max(
    0,
    installmentAmount - paidAmount,
  );
}

/* ============================================================
   SOURCE
============================================================ */

function buildSource(
  loan: Loan,
  customerId: string,
): NotificationSourceReference {
  const loanNumber =
    String(loan.loanNumber ?? "").trim();

  return {
    customerId,

    loanId:
      loan.id,

    ...(loanNumber
      ? {
          loanNumber,
        }
      : {}),
  };
}

/* ============================================================
   RULES ENGINE
============================================================ */

export class LoanNotificationRulesEngine {
  evaluate(
    loan: Loan,

    evaluationTimestamp: string,
  ): LoanNotificationRuleEvaluation {
    const matches: LoanNotificationRuleMatch[] = [];
    const issues: LoanNotificationRuleIssue[] = [];

    /* --------------------------------------------------------
       EVALUATION CALENDAR
    -------------------------------------------------------- */

    const evaluationCalendarKey =
      toLocalCalendarKey(
        evaluationTimestamp,
      );

    if (evaluationCalendarKey === undefined) {
      return {
        suppressed: true,

        matches,

        issues: [
          {
            code:
              "INVALID_EVALUATION_TIMESTAMP",

            message:
              "Loan Notification Rules Engine received an invalid evaluation timestamp.",

            loanId:
              String(loan.id ?? ""),
          },
        ],
      };
    }

    /* --------------------------------------------------------
       AUTHORITATIVE SETTLEMENT GATE
    -------------------------------------------------------- */

    const loanOutstanding =
      parseNonNegativeNumber(
        loan.outstanding,
      );

    if (loanOutstanding === undefined) {
      return {
        suppressed: true,

        matches,

        issues: [
          {
            code:
              "INVALID_LOAN_OUTSTANDING",

            message:
              `Loan ${String(loan.id ?? "")} has an invalid authoritative outstanding balance.`,

            loanId:
              String(loan.id ?? ""),
          },
        ],
      };
    }

    const loanStatus =
      String(loan.status ?? "")
        .trim()
        .toUpperCase();

    if (
      loanStatus === "CLOSED" ||
      loanOutstanding <= 0
    ) {
      return {
        suppressed: true,

        matches,

        issues,
      };
    }

    /* --------------------------------------------------------
       CUSTOMER IDENTITY
    -------------------------------------------------------- */

    const customerId =
      String(loan.customerId ?? "").trim();

    if (!customerId) {
      return {
        suppressed: true,

        matches,

        issues: [
          {
            code:
              "MISSING_CUSTOMER_ID",

            message:
              `Loan ${String(loan.id ?? "")} has no authoritative Customer ID for Notification evaluation.`,

            loanId:
              String(loan.id ?? ""),
          },
        ],
      };
    }

    const source =
      buildSource(
        loan,
        customerId,
      );

    /* --------------------------------------------------------
       COLLECTIBLE INSTALLMENTS
    -------------------------------------------------------- */

    const persistedSchedule =
      getPersistedSchedule(loan);

    const dueInstallments: CollectibleInstallment[] = [];
    const overdueInstallments: CollectibleInstallment[] = [];

    for (
      const installment
      of persistedSchedule.schedule ?? []
    ) {
      const remainingAmount =
        getInstallmentRemainingAmount(
          installment,
        );

      if (remainingAmount <= 0) {
        continue;
      }

      const dueAt =
        String(
          installment.dueDate ?? "",
        ).trim();

      const installmentNumber =
        Number(
          installment.installmentNumber,
        );

      const calendarKey =
        dueAt
          ? toLocalCalendarKey(dueAt)
          : undefined;

      if (calendarKey === undefined) {
        issues.push({
          code:
            "INVALID_INSTALLMENT_DUE_DATE",

          message:
            `Loan ${loan.id} installment ${installmentNumber} has an invalid due date.`,

          loanId:
            loan.id,

          ...(Number.isFinite(installmentNumber)
            ? {
                installmentNumber,
              }
            : {}),
        });

        continue;
      }

      const collectible: CollectibleInstallment = {
        installmentNumber:
          Number.isFinite(installmentNumber)
            ? installmentNumber
            : 0,

        dueAt,

        calendarKey,

        remainingAmount,
      };

      if (
        calendarKey ===
        evaluationCalendarKey
      ) {
        dueInstallments.push(
          collectible,
        );

        continue;
      }

      if (
        calendarKey <
        evaluationCalendarKey
      ) {
        overdueInstallments.push(
          collectible,
        );
      }
    }

    /* --------------------------------------------------------
       DUE INSTALLMENTS
    -------------------------------------------------------- */

    if (dueInstallments.length > 0) {
      matches.push({
        eventType:
          "LOAN_DUE",

        basis:
          "INSTALLMENT",

        source,

        dueAt:
          dueInstallments[0].dueAt,

        loanOutstanding,

        installmentNumbers:
          dueInstallments.map(
            (installment) =>
              installment.installmentNumber,
          ),

        installmentRemainingTotal:
          dueInstallments.reduce(
            (total, installment) =>
              total +
              installment.remainingAmount,

            0,
          ),
      });
    }

    /* --------------------------------------------------------
       OVERDUE INSTALLMENTS
    -------------------------------------------------------- */

    if (overdueInstallments.length > 0) {
      overdueInstallments.sort(
        (left, right) =>
          left.calendarKey -
          right.calendarKey,
      );

      matches.push({
        eventType:
          "LOAN_OVERDUE",

        basis:
          "INSTALLMENT",

        source,

        dueAt:
          overdueInstallments[0].dueAt,

        loanOutstanding,

        installmentNumbers:
          overdueInstallments.map(
            (installment) =>
              installment.installmentNumber,
          ),

        installmentRemainingTotal:
          overdueInstallments.reduce(
            (total, installment) =>
              total +
              installment.remainingAmount,

            0,
          ),
      });
    }

    /* --------------------------------------------------------
       LOAN MATURITY
    -------------------------------------------------------- */

    const loanDueAt =
      String(loan.dueDate ?? "").trim();

    let loanDueCalendarKey:
      number | undefined;

    if (loanDueAt) {
      loanDueCalendarKey =
        toLocalCalendarKey(
          loanDueAt,
        );

      if (loanDueCalendarKey === undefined) {
        issues.push({
          code:
            "INVALID_LOAN_DUE_DATE",

          message:
            `Loan ${loan.id} has an invalid maturity date.`,

          loanId:
            loan.id,
        });
      }
    }

    if (
      loanDueCalendarKey ===
      evaluationCalendarKey
    ) {
      matches.push({
        eventType:
          "LOAN_MATURITY",

        basis:
          "MATURITY",

        source,

        dueAt:
          loanDueAt,

        loanOutstanding,

        installmentNumbers:
          [],

        installmentRemainingTotal:
          0,
      });
    }

    /* --------------------------------------------------------
       MATURITY OVERDUE FALLBACK

       If no collectible installment is already overdue, an
       outstanding Loan whose contractual maturity has passed
       remains overdue at Loan level.

       This protects Loan types or legacy records whose
       installment schedule is absent or incomplete.
    -------------------------------------------------------- */

    if (
      overdueInstallments.length === 0 &&
      loanDueCalendarKey !== undefined &&
      loanDueCalendarKey <
        evaluationCalendarKey
    ) {
      matches.push({
        eventType:
          "LOAN_OVERDUE",

        basis:
          "MATURITY",

        source,

        dueAt:
          loanDueAt,

        loanOutstanding,

        installmentNumbers:
          [],

        installmentRemainingTotal:
          0,
      });
    }

    return {
      suppressed: false,

      matches,

      issues,
    };
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const loanNotificationRulesEngine =
  new LoanNotificationRulesEngine();

/* ============================================================
   END
============================================================ */
