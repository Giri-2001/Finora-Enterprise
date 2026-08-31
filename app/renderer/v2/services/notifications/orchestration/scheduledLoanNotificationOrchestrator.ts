// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// SCHEDULED LOAN NOTIFICATION ORCHESTRATOR
//
// RESPONSIBILITY:
//
// - Load live authoritative Loans.
// - Distinguish an empty portfolio from Loan storage failure.
// - Evaluate each Loan through the Loan Notification Rules Engine.
// - Forward each canonical rule match to the scheduled generator.
// - Preserve rule issues and generation failures for diagnostics.
// - Keep one scheduler-slot run observable and deterministic.
//
// IMPORTANT:
//
// - No UI.
// - No provider calls.
// - No retry execution.
// - No scheduler timing calculation.
// - No direct storage access.
// - LoanRepository remains authoritative for Loan loading.
// - Rules Engine remains authoritative for reminder eligibility.
// - Generator remains authoritative for durable Notification artifacts.
// - One Loan failure must not prevent evaluation of other Loans.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import {
  getLoansResult,
} from "../../../repositories/loan/loanRepository";

import {
  loanNotificationRulesEngine,
} from "../rules/loanNotificationRulesEngine";

import type {
  LoanNotificationRuleIssue,
  LoanNotificationRuleMatch,
} from "../rules/loanNotificationRulesEngine";

import {
  scheduledLoanNotificationGenerator,
} from "../generation/scheduledLoanNotificationGenerator";

import type {
  ScheduledLoanNotificationGenerationResult,
  ScheduledLoanNotificationGeneratorScope,
} from "../generation/scheduledLoanNotificationGenerator";

import type {
  ScheduledNotificationSlot,
} from "../generation/notificationGenerationIdentity";

import type {
  RepositoryWriteOptions,
} from "../../../repositories/repository.types";

import {
  isSupportedBusinessTimeZone,
} from "../../../constants/business/businessTimeZone.constants";

/* ============================================================
   INPUT
============================================================ */

export interface ScheduledLoanNotificationOrchestratorInput {
  scope:
    ScheduledLoanNotificationGeneratorScope;

  /**
   * Persisted IANA time-zone identifier for the active business.
   *
   * This is authoritative for scheduler calendar calculations.
   * Device-local time must not be used as an implicit fallback.
   */
  timeZone: string;

  /**
   * Business-local calendar identity for this scheduler slot.
   *
   * YYYY-MM-DD.
   */
  calendarDate: string;

  slot:
    ScheduledNotificationSlot;

  /**
   * Canonical scheduler-slot timestamp.
   *
   * Also used as the Rules Engine evaluation timestamp so the
   * rule evaluation and durable slot identity describe the same
   * logical scheduled run.
   */
  scheduledFor: string;

  /**
   * Actual execution / generation timestamp.
   */
  generatedAt: string;
}

/* ============================================================
   LOAN REPORT
============================================================ */

export interface ScheduledLoanNotificationLoanReport {
  loanId: string;

  loanNumber?: string;

  suppressed: boolean;

  issues:
    LoanNotificationRuleIssue[];

  matchCount: number;

  generations:
    ScheduledLoanNotificationMatchReport[];
}

/* ============================================================
   MATCH REPORT
============================================================ */

export interface ScheduledLoanNotificationMatchReport {
  match:
    LoanNotificationRuleMatch;

  generation:
    ScheduledLoanNotificationGenerationResult;
}

/* ============================================================
   RUN REPORT
============================================================ */

export interface ScheduledLoanNotificationOrchestratorReport {
  timeZone: string;

  calendarDate: string;

  slot:
    ScheduledNotificationSlot;

  scheduledFor: string;

  generatedAt: string;

  loanCount: number;

  suppressedLoanCount: number;

  ruleIssueCount: number;

  matchCount: number;

  generationSuccessCount: number;

  generationFailureCount: number;

  loans:
    ScheduledLoanNotificationLoanReport[];

  errors: string[];
}

/* ============================================================
   RESULT
============================================================ */

export type ScheduledLoanNotificationOrchestratorResult =
  | {
      success: true;

      report:
        ScheduledLoanNotificationOrchestratorReport;
    }
  | {
      success: false;

      error: string;

      report?:
        ScheduledLoanNotificationOrchestratorReport;
    };

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(
  value: unknown,
): string {
  return String(value ?? "").trim();
}

/* ============================================================
   SLOT VALIDATION
============================================================ */

const VALID_SLOTS:
  readonly ScheduledNotificationSlot[] = [
    "MORNING",
    "EVENING",
  ];

/* ============================================================
   TIMESTAMP VALIDATION
============================================================ */

function isValidTimestamp(
  value: string,
): boolean {
  const normalized =
    normalizeString(value);

  if (!normalized) {
    return false;
  }

  return Number.isFinite(
    new Date(normalized).getTime(),
  );
}

/* ============================================================
   CALENDAR DATE VALIDATION
============================================================ */

function isValidCalendarDate(
  value: string,
): boolean {
  const normalized =
    normalizeString(value);

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      normalized,
    );

  if (!match) {
    return false;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  if (
    year < 1000 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1
  ) {
    return false;
  }

  const validationDate =
    new Date(
      year,
      month - 1,
      day,
    );

  return (
    validationDate.getFullYear() === year &&
    validationDate.getMonth() === month - 1 &&
    validationDate.getDate() === day
  );
}

function getBusinessCalendarDateFromTimestamp(
  value: string,
  timeZone: string,
): string | undefined {
  const normalized =
    normalizeString(value);

  const normalizedTimeZone =
    normalizeString(timeZone);

  if (
    !normalized ||
    !normalizedTimeZone
  ) {
    return undefined;
  }

  const date =
    new Date(normalized);

  if (!Number.isFinite(date.getTime())) {
    return undefined;
  }

  try {
    const parts =
      new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone:
            normalizedTimeZone,

          year:
            "numeric",

          month:
            "2-digit",

          day:
            "2-digit",
        },
      ).formatToParts(
        date,
      );

    const year =
      parts.find(
        (part) =>
          part.type === "year",
      )?.value;

    const month =
      parts.find(
        (part) =>
          part.type === "month",
      )?.value;

    const day =
      parts.find(
        (part) =>
          part.type === "day",
      )?.value;

    if (
      !year ||
      !month ||
      !day
    ) {
      return undefined;
    }

    return `${year}-${month}-${day}`;
  } catch {
    return undefined;
  }
}

/* ============================================================
   REPORT FINALIZATION
============================================================ */

function finalizeReport(
  report:
    ScheduledLoanNotificationOrchestratorReport,
): ScheduledLoanNotificationOrchestratorResult {
  if (report.errors.length === 0) {
    return {
      success: true,

      report,
    };
  }

  return {
    success: false,

    error:
      report.errors.join(" | "),

    report,
  };
}

/* ============================================================
   ORCHESTRATOR
============================================================ */

export class ScheduledLoanNotificationOrchestrator {
  async run(
    input:
      ScheduledLoanNotificationOrchestratorInput,

    options?:
      RepositoryWriteOptions,
  ): Promise<
    ScheduledLoanNotificationOrchestratorResult
  > {
    const scope:
      ScheduledLoanNotificationGeneratorScope = {
        ownerId:
          normalizeString(
            input.scope.ownerId,
          ),

        businessId:
          normalizeString(
            input.scope.businessId,
          ),

        branchId:
          normalizeString(
            input.scope.branchId,
          ),
      };

    if (!scope.ownerId) {
      return {
        success: false,

        error:
          "Owner ID is required for scheduled Loan Notification orchestration.",
      };
    }

    if (!scope.businessId) {
      return {
        success: false,

        error:
          "Business ID is required for scheduled Loan Notification orchestration.",
      };
    }

    if (!scope.branchId) {
      return {
        success: false,

        error:
          "Branch ID is required for scheduled Loan Notification orchestration.",
      };
    }

    const timeZone =
      normalizeString(
        input.timeZone,
      );

    if (!timeZone) {
      return {
        success: false,

        error:
          "Business time zone is required for scheduled Loan Notification orchestration.",
      };
    }

    if (
      !isSupportedBusinessTimeZone(
        timeZone,
      )
    ) {
      return {
        success: false,

        error:
          "Business time zone is invalid for scheduled Loan Notification orchestration.",
      };
    }

    if (
      !VALID_SLOTS.includes(
        input.slot,
      )
    ) {
      return {
        success: false,

        error:
          "Scheduler slot is invalid for scheduled Loan Notification orchestration.",
      };
    }

    const calendarDate =
      normalizeString(
        input.calendarDate,
      );

    if (!isValidCalendarDate(calendarDate)) {
      return {
        success: false,

        error:
          "Business-local calendar date is invalid for scheduled Loan Notification orchestration.",
      };
    }

    if (!isValidTimestamp(input.scheduledFor)) {
      return {
        success: false,

        error:
          "Scheduled-for timestamp is invalid for scheduled Loan Notification orchestration.",
      };
    }

    const scheduledCalendarDate =
      getBusinessCalendarDateFromTimestamp(
        input.scheduledFor,
        timeZone,
      );

    if (
      scheduledCalendarDate !==
      calendarDate
    ) {
      return {
        success: false,

        error:
          "Scheduled-for timestamp calendar date does not match the orchestration calendar identity.",
      };
    }

    if (!isValidTimestamp(input.generatedAt)) {
      return {
        success: false,

        error:
          "Generation timestamp is invalid for scheduled Loan Notification orchestration.",
      };
    }

    /* ========================================================
       AUTHORITATIVE LOAN LOAD
    ======================================================== */

    const loansResult =
      await getLoansResult();

    if (!loansResult.success) {
      return {
        success: false,

        error:
          loansResult.error ??
          "Unable to load authoritative Loans for Notification orchestration.",
      };
    }

    const loans =
      loansResult.data ?? [];

    const report:
      ScheduledLoanNotificationOrchestratorReport = {
        timeZone,

        calendarDate,

        slot:
          input.slot,

        scheduledFor:
          input.scheduledFor,

        generatedAt:
          input.generatedAt,

        loanCount:
          loans.length,

        suppressedLoanCount:
          0,

        ruleIssueCount:
          0,

        matchCount:
          0,

        generationSuccessCount:
          0,

        generationFailureCount:
          0,

        loans: [],

        errors: [],
      };

    /* ========================================================
       LOAN EVALUATION
    ======================================================== */

    for (const loan of loans) {
      const evaluation =
        loanNotificationRulesEngine.evaluate(
          loan,

          input.scheduledFor,
        );

      const loanReport:
        ScheduledLoanNotificationLoanReport = {
          loanId:
            normalizeString(loan.id),

          ...(normalizeString(loan.loanNumber)
            ? {
                loanNumber:
                  normalizeString(loan.loanNumber),
              }
            : {}),

          suppressed:
            evaluation.suppressed,

          issues:
            evaluation.issues,

          matchCount:
            evaluation.matches.length,

          generations: [],
        };

      report.ruleIssueCount +=
        evaluation.issues.length;

      report.matchCount +=
        evaluation.matches.length;

      if (evaluation.suppressed) {
        report.suppressedLoanCount += 1;
      }

      for (
        const issue
        of evaluation.issues
      ) {
        report.errors.push(
          `[RULE:${issue.code}] ${issue.message}`,
        );
      }

      /* ------------------------------------------------------
         GENERATE EACH MATCH

         One failed match does not prevent later matches or
         other Loans from being processed.
      ------------------------------------------------------ */

      for (
        const match
        of evaluation.matches
      ) {
        let generation:
          ScheduledLoanNotificationGenerationResult;

        try {
          generation =
            await scheduledLoanNotificationGenerator.generate(
              {
                scope,

                match,

                calendarDate,

                slot:
                  input.slot,

                scheduledFor:
                  input.scheduledFor,

                generatedAt:
                  input.generatedAt,
              },

              options,
            );
        } catch (error) {
          generation = {
            success: false,

            error:
              error instanceof Error
                ? error.message
                : "Scheduled Loan Notification generation failed unexpectedly.",
          };
        }

        loanReport.generations.push({
          match,

          generation,
        });

        if (generation.success) {
          report.generationSuccessCount += 1;
        } else {
          report.generationFailureCount += 1;

          report.errors.push(
            `[GENERATION:${loan.id}:${match.eventType}] ${generation.error}`,
          );
        }
      }

      report.loans.push(
        loanReport,
      );
    }

    return finalizeReport(
      report,
    );
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const scheduledLoanNotificationOrchestrator =
  new ScheduledLoanNotificationOrchestrator();

/* ============================================================
   END
============================================================ */
