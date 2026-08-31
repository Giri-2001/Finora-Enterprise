// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// NOTIFICATION DELIVERY LIFECYCLE
//
// RESPONSIBILITY:
//
// - Start customer Notification delivery execution after auth.
// - Perform immediate startup catch-up.
// - Re-check deliveries when the application regains focus.
// - Re-check deliveries when the document becomes visible.
// - Serialize overlapping lifecycle wake-ups.
// - Wake at persisted retry / scheduled delivery times.
// - Periodically discover newly-created delivery artifacts.
// - Recover from temporary execution-boundary failures.
//
// IMPORTANT:
//
// - This is separate from the 09:00 / 20:00 reminder scheduler.
// - Provider retry timing comes from persisted nextRetryAt.
// - fallbackWakeupMs is lifecycle recovery/discovery timing.
// - fallbackWakeupMs is NOT provider retry policy.
// - No React.
// - No UI.
// - No direct repository access.
// - No direct provider calls.
// - SENDING crash recovery is intentionally separate.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import type {
  NotificationDeliveryRepositoryScope,
} from "../../../repositories/notifications/notificationDeliveryRepository";

import type {
  NotificationDeliveryExecution,
  NotificationDeliveryExecutionResult,
} from "./notificationDeliveryExecution";

/* ============================================================
   DEPENDENCIES
============================================================ */

export interface NotificationDeliveryLifecycleDependencies {
  execution:
    NotificationDeliveryExecution;

  /*
   * Maximum lifecycle recovery/discovery delay.
   *
   * This keeps the runtime able to discover deliveries that
   * were persisted after the previous wake plan was calculated.
   *
   * This is NOT a provider retry interval.
   */

  fallbackWakeupMs:
    number;
}

/* ============================================================
   INPUT
============================================================ */

export interface NotificationDeliveryLifecycleInput {
  scope:
    NotificationDeliveryRepositoryScope;
}

/* ============================================================
   STATE
============================================================ */

export interface NotificationDeliveryLifecycleState {
  active:
    boolean;

  running:
    boolean;

  nextWakeAt?:
    string;

  lastRunAt?:
    string;

  lastResult?:
    NotificationDeliveryExecutionResult;
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

function assertPositiveDelay(
  value:
    number,
): void {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      "Notification Delivery lifecycle fallbackWakeupMs must be greater than zero.",
    );
  }
}

/* ============================================================
   LIFECYCLE
============================================================ */

export class NotificationDeliveryLifecycle {
  private active =
    false;

  private running =
    false;

  private rerunRequested =
    false;

  /*
   * Invalidates an older in-flight run after stop / restart.
   */

  private lifecycleGeneration =
    0;

  private timerId:
    number | undefined;

  private scope:
    NotificationDeliveryRepositoryScope | undefined;

  private nextWakeAt:
    string | undefined;

  private lastRunAt:
    string | undefined;

  private lastResult:
    NotificationDeliveryExecutionResult | undefined;

  constructor(
    private readonly dependencies:
      NotificationDeliveryLifecycleDependencies,
  ) {
    assertPositiveDelay(
      dependencies.fallbackWakeupMs,
    );
  }

  // ==========================================================
  // START
  // ==========================================================

  start(
    input:
      NotificationDeliveryLifecycleInput,
  ): void {
    this.stop();

    const scope:
      NotificationDeliveryRepositoryScope = {
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
        "FINORA Notification Delivery lifecycle was not started because the authenticated business scope is incomplete.",
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
    NotificationDeliveryLifecycleState {
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
          NotificationDeliveryExecutionResult;

        try {
          result =
            await this.dependencies.execution.run(
              this.scope,
            );
        } catch (error) {
          result = {
            success: false,

            error:
              error instanceof Error
                ? error.message
                : "Notification Delivery lifecycle execution failed unexpectedly.",
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
            "FINORA Notification Delivery lifecycle execution failed:",
            result.error,
          );

          this.armFallbackWakeup();

          continue;
        }

        const wakePlanResult =
          result.report
            .wakePlanResult;

        if (!wakePlanResult.success) {
          this.armFallbackWakeup();

          continue;
        }

        const plan =
          wakePlanResult.plan;

        /*
         * A currently-due Delivery remaining after processing
         * normally means execution was safely deferred by the
         * provider-availability gate.
         *
         * Do not tight-loop. Reconsider on the bounded lifecycle
         * fallback wake, focus, visibility, or manual refresh.
         */

        if (plan.dueCount > 0) {
          this.armFallbackWakeup();

          continue;
        }

        /*
         * Wake no later than fallbackWakeupMs even when a later
         * retry/scheduled time exists.
         *
         * This allows the lifecycle to discover newly-created
         * delivery artifacts without changing provider retry
         * eligibility semantics.
         */

        this.armPlannedOrFallbackWakeup(
          plan.nextWakeAt,
        );
      } while (
        this.active &&
        this.rerunRequested
      );
    } finally {
      this.running =
        false;

      /*
       * A restart/refresh can arrive while an older run is still
       * in flight. Begin the queued run only after the current
       * serialization lock is released.
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
  // PLANNED / DISCOVERY WAKE-UP
  // ==========================================================

  private armPlannedOrFallbackWakeup(
    plannedWakeAt?:
      string,
  ): void {
    const nowTimestamp =
      Date.now();

    const fallbackTimestamp =
      nowTimestamp +
      this.dependencies.fallbackWakeupMs;

    let targetTimestamp =
      fallbackTimestamp;

    if (plannedWakeAt) {
      const plannedTimestamp =
        Date.parse(
          plannedWakeAt,
        );

      if (
        Number.isFinite(
          plannedTimestamp,
        )
      ) {
        targetTimestamp =
          Math.min(
            Math.max(
              nowTimestamp,
              plannedTimestamp,
            ),

            fallbackTimestamp,
          );
      }
    }

    this.armWakeupAt(
      targetTimestamp,
    );
  }

  // ==========================================================
  // FALLBACK WAKE-UP
  // ==========================================================

  private armFallbackWakeup():
    void {
    this.armWakeupAt(
      Date.now() +
      this.dependencies.fallbackWakeupMs,
    );
  }

  // ==========================================================
  // ARM ONE-SHOT WAKE-UP
  // ==========================================================

  private armWakeupAt(
    targetTimestamp:
      number,
  ): void {
    if (
      !Number.isFinite(
        targetTimestamp,
      )
    ) {
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
   END
============================================================ */