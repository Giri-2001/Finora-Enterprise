// ============================================================
// FINORA ENTERPRISE OS(TM)
//
// NOTIFICATIONS ENGINE(TM)
// SCHEDULED LOAN NOTIFICATION SCHEDULER RUNNER
//
// RESPONSIBILITY:
//
// - Plan currently due scheduled Notification slots
// - Execute each due slot through the Loan Notification Orchestrator
// - Preserve per-slot success / failure diagnostics
// - Continue later due slots when one slot fails
//
// IMPORTANT:
//
// - No timers.
// - No React.
// - No UI.
// - No direct storage access.
// - No provider calls.
// - No retry execution.
// - Business Settings loading belongs to lifecycle integration.
// - Deterministic generation identity provides repeated-run deduplication.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  ScheduledLoanNotificationGeneratorScope,
} from "../generation/scheduledLoanNotificationGenerator";

import {
  scheduledLoanNotificationOrchestrator,
} from "../orchestration/scheduledLoanNotificationOrchestrator";

import type {
  ScheduledLoanNotificationOrchestratorResult,
} from "../orchestration/scheduledLoanNotificationOrchestrator";

import {
  planScheduledNotificationSlots,
} from "./scheduledNotificationSlotPlanner";

import type {
  ScheduledNotificationClockResolution,
} from "./scheduledNotificationClock";

import type {
  RepositoryWriteOptions,
} from "../../../repositories/repository.types";

/* ============================================================
   INPUT
============================================================ */

export interface ScheduledLoanNotificationSchedulerRunnerInput {
  scope:
    ScheduledLoanNotificationGeneratorScope;

  timeZone: string;

  /**
   * Actual scheduler evaluation time.
   *
   * Defaults to Date.now() through the slot planner.
   */
  now?:
    string | number | Date;
}

/* ============================================================
   SLOT REPORT
============================================================ */

export interface ScheduledLoanNotificationSchedulerSlotReport {
  slot:
    ScheduledNotificationClockResolution;

  result:
    ScheduledLoanNotificationOrchestratorResult;
}

/* ============================================================
   RUN REPORT
============================================================ */

export interface ScheduledLoanNotificationSchedulerRunnerReport {
  timeZone: string;

  evaluatedAt: string;

  calendarDate: string;

  dueSlotCount: number;

  executedSlotCount: number;

  failedSlotCount: number;

  nextSlot:
    ScheduledNotificationClockResolution;

  slots:
    ScheduledLoanNotificationSchedulerSlotReport[];

  errors: string[];
}

/* ============================================================
   RESULT
============================================================ */

export type ScheduledLoanNotificationSchedulerRunnerResult =
  | {
      success: true;

      report:
        ScheduledLoanNotificationSchedulerRunnerReport;
    }
  | {
      success: false;

      error: string;

      report?:
        ScheduledLoanNotificationSchedulerRunnerReport;
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
   FINALIZATION
============================================================ */

function finalizeReport(
  report:
    ScheduledLoanNotificationSchedulerRunnerReport,
): ScheduledLoanNotificationSchedulerRunnerResult {
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
   RUNNER
============================================================ */

export class ScheduledLoanNotificationSchedulerRunner {
  async run(
    input:
      ScheduledLoanNotificationSchedulerRunnerInput,

    options?:
      RepositoryWriteOptions,
  ): Promise<
    ScheduledLoanNotificationSchedulerRunnerResult
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
          "Owner ID is required for scheduled Loan Notification scheduler execution.",
      };
    }

    if (!scope.businessId) {
      return {
        success: false,

        error:
          "Business ID is required for scheduled Loan Notification scheduler execution.",
      };
    }

    if (!scope.branchId) {
      return {
        success: false,

        error:
          "Branch ID is required for scheduled Loan Notification scheduler execution.",
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
          "Business time zone is required for scheduled Loan Notification scheduler execution.",
      };
    }

    const plan =
      planScheduledNotificationSlots({
        timeZone,

        now:
          input.now,
      });

    if (!plan.success) {
      return {
        success: false,

        error:
          plan.error,
      };
    }

    const report:
      ScheduledLoanNotificationSchedulerRunnerReport = {
        timeZone:
          plan.data.timeZone,

        evaluatedAt:
          plan.data.evaluatedAt,

        calendarDate:
          plan.data.calendarDate,

        dueSlotCount:
          plan.data.dueSlots.length,

        executedSlotCount:
          0,

        failedSlotCount:
          0,

        nextSlot:
          plan.data.nextSlot,

        slots: [],

        errors: [],
      };

    for (
      const slot
      of plan.data.dueSlots
    ) {
      let result:
        ScheduledLoanNotificationOrchestratorResult;

      try {
        result =
          await scheduledLoanNotificationOrchestrator.run(
            {
              scope,

              timeZone:
                plan.data.timeZone,

              calendarDate:
                slot.calendarDate,

              slot:
                slot.slot,

              scheduledFor:
                slot.scheduledFor,

              generatedAt:
                plan.data.evaluatedAt,
            },

            options,
          );
      } catch (error) {
        result = {
          success: false,

          error:
            error instanceof Error
              ? error.message
              : "Scheduled Loan Notification orchestration failed unexpectedly.",
        };
      }

      report.executedSlotCount +=
        1;

      report.slots.push({
        slot,

        result,
      });

      if (!result.success) {
        report.failedSlotCount +=
          1;

        report.errors.push(
          `[SLOT:${slot.calendarDate}:${slot.slot}] ${result.error}`,
        );
      }
    }

    return finalizeReport(
      report,
    );
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const scheduledLoanNotificationSchedulerRunner =
  new ScheduledLoanNotificationSchedulerRunner();

/* ============================================================
   END
============================================================ */