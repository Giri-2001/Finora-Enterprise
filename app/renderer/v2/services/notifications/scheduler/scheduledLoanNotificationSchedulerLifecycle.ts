// ============================================================
// FINORA ENTERPRISE OS(TM)
//
// NOTIFICATIONS ENGINE(TM)
// SCHEDULED LOAN NOTIFICATION SCHEDULER LIFECYCLE
//
// RESPONSIBILITY:
//
// - Start scheduled Notification execution after authentication
// - Perform immediate startup catch-up
// - Arm a one-shot timer for the next canonical scheduler slot
// - Re-check due slots when the application regains focus
// - Re-check due slots when the document becomes visible
// - Serialize overlapping lifecycle wake-ups
// - Recover from temporary execution-boundary failures
//
// IMPORTANT:
//
// - This is NOT an interval-only scheduler.
// - Canonical slot time comes from the business-local planner.
// - Startup / focus / visibility wake-ups always re-plan.
// - Deterministic generation identity prevents duplicate artifacts.
// - Provider retry logic does not belong here.
// - No React.
// - No UI.
// - No direct repository access.
// - No direct provider calls.
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
  scheduledLoanNotificationSchedulerExecution,
} from "./scheduledLoanNotificationSchedulerExecution";

import type {
  ScheduledLoanNotificationSchedulerExecutionResult,
} from "./scheduledLoanNotificationSchedulerExecution";

import type {
  ScheduledNotificationClockResolution,
} from "./scheduledNotificationClock";

/* ============================================================
   CONSTANTS
============================================================ */

/**
 * Used only when execution cannot reach the planner/report
 * boundary, for example:
 *
 * - USB temporarily unavailable
 * - Business Settings temporarily unavailable
 * - Business time zone not yet configured
 *
 * This is a lifecycle recovery wake-up.
 * It is NOT Notification provider retry policy.
 */
const SCHEDULER_RECOVERY_WAKEUP_MS =
  5 * 60 * 1000;

/* ============================================================
   TYPES
============================================================ */

export interface ScheduledLoanNotificationSchedulerLifecycleInput {
  scope:
    ScheduledLoanNotificationGeneratorScope;
}

export interface ScheduledLoanNotificationSchedulerLifecycleState {
  active:
    boolean;

  running:
    boolean;

  nextWakeAt?:
    string;

  lastRunAt?:
    string;

  lastResult?:
    ScheduledLoanNotificationSchedulerExecutionResult;
}

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(
  value:
    unknown,
): string {
  return String(
    value ?? "",
  ).trim();
}

/* ============================================================
   LIFECYCLE
============================================================ */

export class ScheduledLoanNotificationSchedulerLifecycle {
  private active =
    false;

  private running =
    false;

  private rerunRequested =
    false;

  /**
   * Invalidates results from an older in-flight lifecycle run
   * after stop / restart.
   */
  private lifecycleGeneration =
    0;

  private timerId:
    number | undefined;

  private scope:
    ScheduledLoanNotificationGeneratorScope | undefined;

  private nextWakeAt:
    string | undefined;

  private lastRunAt:
    string | undefined;

  private lastResult:
    ScheduledLoanNotificationSchedulerExecutionResult | undefined;

  // ==========================================================
  // START
  // ==========================================================

  start(
    input:
      ScheduledLoanNotificationSchedulerLifecycleInput,
  ): void {
    this.stop();

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

    if (
      !scope.ownerId ||
      !scope.businessId ||
      !scope.branchId
    ) {
      console.warn(
        "FINORA scheduled Notification scheduler was not started because the authenticated business scope is incomplete.",
      );

      return;
    }

    this.scope =
      scope;

    this.active =
      true;

    window.addEventListener(
      "focus",
      this.handleWindowFocus,
    );

    document.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );

    void this.requestRun();
  }

  // ==========================================================
  // STOP
  // ==========================================================

  stop(): void {
    this.lifecycleGeneration +=
      1;

    this.active =
      false;

    this.rerunRequested =
      false;

    this.clearTimer();

    window.removeEventListener(
      "focus",
      this.handleWindowFocus,
    );

    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );

    this.scope =
      undefined;

    this.nextWakeAt =
      undefined;
  }

  // ==========================================================
  // MANUAL REFRESH
  // ==========================================================

  refresh(): void {
    if (!this.active) {
      return;
    }

    void this.requestRun();
  }

  // ==========================================================
  // STATE
  // ==========================================================

  getState():
    ScheduledLoanNotificationSchedulerLifecycleState {
    return {
      active:
        this.active,

      running:
        this.running,

      nextWakeAt:
        this.nextWakeAt,

      lastRunAt:
        this.lastRunAt,

      lastResult:
        this.lastResult,
    };
  }

  // ==========================================================
  // WINDOW FOCUS
  // ==========================================================

  private readonly handleWindowFocus =
    (): void => {
      if (!this.active) {
        return;
      }

      void this.requestRun();
    };

  // ==========================================================
  // DOCUMENT VISIBILITY
  // ==========================================================

  private readonly handleVisibilityChange =
    (): void => {
      if (
        !this.active ||
        document.visibilityState !==
          "visible"
      ) {
        return;
      }

      void this.requestRun();
    };

  // ==========================================================
  // REQUEST RUN
  // ==========================================================

  private async requestRun():
    Promise<void> {
    if (
      !this.active ||
      !this.scope
    ) {
      return;
    }

    if (this.running) {
      this.rerunRequested =
        true;

      return;
    }

    const lifecycleGeneration =
      this.lifecycleGeneration;

    this.running =
      true;

    try {
      do {
        this.rerunRequested =
          false;

        this.clearTimer();

        if (
          !this.active ||
          !this.scope ||
          lifecycleGeneration !==
            this.lifecycleGeneration
        ) {
          return;
        }

        const runAt =
          new Date().toISOString();

        this.lastRunAt =
          runAt;

        let result:
          ScheduledLoanNotificationSchedulerExecutionResult;

        try {
          result =
            await scheduledLoanNotificationSchedulerExecution.run(
              {
                scope:
                  this.scope,

                now:
                  runAt,
              },
            );
        } catch (error) {
          result = {
            success: false,

            error:
              error instanceof Error
                ? error.message
                : "Scheduled Loan Notification lifecycle execution failed unexpectedly.",
          };
        }

        if (
          !this.active ||
          lifecycleGeneration !==
            this.lifecycleGeneration
        ) {
          return;
        }

        this.lastResult =
          result;

        if (!result.success) {
          console.warn(
            "FINORA scheduled Notification scheduler execution failed:",
            result.error,
          );

          /**
           * A due-slot execution failure must not wait until
           * the next canonical 09:00 / 20:00 slot.
           *
           * Re-check after the bounded lifecycle recovery
           * delay. Deterministic generation identity keeps
           * already-created artifacts idempotent.
           */
          this.armRecoveryWakeup();

          continue;
        }

        const nextSlot =
          this.getNextSlotFromResult(
            result,
          );

        if (nextSlot) {
          this.armNextSlot(
            nextSlot,
          );
        } else {
          this.armRecoveryWakeup();
        }
      } while (
        this.active &&
        this.rerunRequested
      );
    } finally {
      this.running =
        false;

      /**
       * A restart can arrive while an older lifecycle execution
       * is still in flight. In that case the new start request
       * is queued through rerunRequested and must begin only
       * after the older execution releases the running lock.
       */
      if (
        this.active &&
        this.rerunRequested
      ) {
        this.rerunRequested =
          false;

        void this.requestRun();
      }
    }
  }

  // ==========================================================
  // NEXT SLOT FROM EXECUTION RESULT
  // ==========================================================

  private getNextSlotFromResult(
    result:
      ScheduledLoanNotificationSchedulerExecutionResult,
  ):
    ScheduledNotificationClockResolution | undefined {
    const runnerResult =
      result.report
        ?.runnerResult;

    if (!runnerResult) {
      return undefined;
    }

    return runnerResult.report
      ?.nextSlot;
  }

  // ==========================================================
  // ARM NEXT CANONICAL SLOT
  // ==========================================================

  private armNextSlot(
    nextSlot:
      ScheduledNotificationClockResolution,
  ): void {
    const targetTimestamp =
      new Date(
        nextSlot.scheduledFor,
      ).getTime();

    if (
      !Number.isFinite(
        targetTimestamp,
      )
    ) {
      this.armRecoveryWakeup();

      return;
    }

    const delay =
      Math.max(
        0,
        targetTimestamp -
          Date.now(),
      );

    this.nextWakeAt =
      new Date(
        Date.now() + delay,
      ).toISOString();

    this.timerId =
      window.setTimeout(
        () => {
          this.timerId =
            undefined;

          this.nextWakeAt =
            undefined;

          void this.requestRun();
        },

        delay,
      );
  }

  // ==========================================================
  // RECOVERY WAKE-UP
  // ==========================================================

  private armRecoveryWakeup():
    void {
    const wakeTimestamp =
      Date.now() +
      SCHEDULER_RECOVERY_WAKEUP_MS;

    this.nextWakeAt =
      new Date(
        wakeTimestamp,
      ).toISOString();

    this.timerId =
      window.setTimeout(
        () => {
          this.timerId =
            undefined;

          this.nextWakeAt =
            undefined;

          void this.requestRun();
        },

        SCHEDULER_RECOVERY_WAKEUP_MS,
      );
  }

  // ==========================================================
  // CLEAR TIMER
  // ==========================================================

  private clearTimer():
    void {
    if (
      this.timerId !==
      undefined
    ) {
      window.clearTimeout(
        this.timerId,
      );

      this.timerId =
        undefined;
    }

    this.nextWakeAt =
      undefined;
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const scheduledLoanNotificationSchedulerLifecycle =
  new ScheduledLoanNotificationSchedulerLifecycle();

/* ============================================================
   END
============================================================ */
