// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// NOTIFICATION DELIVERY EXECUTION
//
// RESPONSIBILITY:
//
// - Enforce the operational Notification delivery storage boundary.
// - Allow customer delivery execution only on LOCAL / USB.
// - Require active storage to be READY.
// - Execute currently due deliveries through the processor.
// - Re-plan delivery wake timing after lifecycle mutations.
//
// IMPORTANT:
//
// - CLOUD is not an operational Notification delivery mode.
// - DEMO is a DataContext, not a StorageMode.
// - No 09:00 / 20:00 reminder scheduler rules.
// - No business time-zone rules.
// - No React.
// - No UI.
// - Provider calls occur only through NotificationDeliveryService.
// - Retry timing decisions remain inside retry policy.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

import {
  storageManager,
} from "../../../storage/storageManager";

import {
  StorageAvailability,
  StorageMode,
} from "../../../storage/storage.types";

import type {
  RepositoryWriteOptions,
} from "../../../repositories/repository.types";

import type {
  NotificationDeliveryRepositoryScope,
} from "../../../repositories/notifications/notificationDeliveryRepository";

import type {
  NotificationDeliveryProcessor,
  NotificationDeliveryProcessResult,
} from "./notificationDeliveryProcessor";

import {
  notificationDeliveryWakePlanner,
} from "./notificationDeliveryWakePlanner";

import type {
  NotificationDeliveryWakePlanResult,
} from "./notificationDeliveryWakePlanner";

import type {
  NotificationSendingRecoveryResult,
  NotificationSendingRecoveryService,
} from "./notificationSendingRecoveryService";

/* ============================================================
   DEPENDENCIES
============================================================ */

export interface NotificationDeliveryExecutionDependencies {
  processor:
    NotificationDeliveryProcessor;

  /*
   * Stale SENDING recovery is injected separately from the
   * normal due-delivery processor.
   *
   * Production composition must provide this dependency.
   */
  sendingRecovery?:
    NotificationSendingRecoveryService;
}

/* ============================================================
   REPORT
============================================================ */

export interface NotificationDeliveryExecutionReport {
  storageMode:
    StorageMode;

  sendingRecoveryResult?:
    NotificationSendingRecoveryResult;

  processorResult:
    NotificationDeliveryProcessResult;

  wakePlanResult:
    NotificationDeliveryWakePlanResult;
}

/* ============================================================
   RESULT
============================================================ */

export type NotificationDeliveryExecutionResult =
  | {
      success: true;

      report:
        NotificationDeliveryExecutionReport;
    }
  | {
      success: false;

      error:
        string;

      report?:
        NotificationDeliveryExecutionReport;
    };

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

function normalizeScope(
  scope:
    NotificationDeliveryRepositoryScope,
): NotificationDeliveryRepositoryScope {
  return {
    ownerId:
      normalizeString(
        scope.ownerId,
      ),

    businessId:
      normalizeString(
        scope.businessId,
      ),

    branchId:
      normalizeString(
        scope.branchId,
      ),
  };
}

/* ============================================================
   STORAGE MODE
============================================================ */

function isOperationalNotificationStorageMode(
  storageMode:
    StorageMode,
): boolean {
  return (
    storageMode ===
      StorageMode.LOCAL ||
    storageMode ===
      StorageMode.USB
  );
}

/* ============================================================
   EXECUTION
============================================================ */

export class NotificationDeliveryExecution {
  constructor(
    private readonly dependencies:
      NotificationDeliveryExecutionDependencies,
  ) {}

  async run(
    inputScope:
      NotificationDeliveryRepositoryScope,

    options?:
      RepositoryWriteOptions,
  ): Promise<
    NotificationDeliveryExecutionResult
  > {
    const scope =
      normalizeScope(
        inputScope,
      );

    if (!scope.ownerId) {
      return {
        success: false,

        error:
          "Owner ID is required for Notification delivery execution.",
      };
    }

    if (!scope.businessId) {
      return {
        success: false,

        error:
          "Business ID is required for Notification delivery execution.",
      };
    }

    if (!scope.branchId) {
      return {
        success: false,

        error:
          "Branch ID is required for Notification delivery execution.",
      };
    }

    // --------------------------------------------------------
    // STORAGE INITIALIZATION
    // --------------------------------------------------------

    if (
      !storageManager.isInitialized()
    ) {
      return {
        success: false,

        error:
          "Active storage is not initialized for Notification delivery execution.",
      };
    }

    // --------------------------------------------------------
    // PHYSICAL STORAGE MODE
    // --------------------------------------------------------

    const storageMode =
      storageManager.getStorageMode();

    if (
      !isOperationalNotificationStorageMode(
        storageMode,
      )
    ) {
      return {
        success: false,

        error:
          `Notification delivery execution is not allowed in storage mode ${storageMode}.`,
      };
    }

    // --------------------------------------------------------
    // STORAGE AVAILABILITY
    // --------------------------------------------------------

    let storageStatus;

    try {
      storageStatus =
        await storageManager.getStatus();
    } catch (error) {
      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to read active storage status for Notification delivery execution.",
      };
    }

    if (
      storageStatus.availability !==
      StorageAvailability.READY
    ) {
      return {
        success: false,

        error:
          `Active ${storageMode} storage is not ready for Notification delivery execution.`,
      };
    }

    // --------------------------------------------------------
    // RECOVER STALE SENDING DELIVERIES
    //
    // A process/application crash can leave a durable delivery
    // stranded in SENDING after the provider-attempt boundary.
    //
    // Recovery runs before normal due processing so a stale
    // SENDING record can return to FAILED + immediate retry
    // eligibility using the same durable deliveryId.
    //
    // Recovery failure is fail-closed: do not continue into
    // provider execution when recovery state is uncertain.
    // --------------------------------------------------------

    let sendingRecoveryResult:
      NotificationSendingRecoveryResult | undefined;

    if (this.dependencies.sendingRecovery) {
      try {
        sendingRecoveryResult =
          await this.dependencies.sendingRecovery.recover(
            scope,
            options,
          );
      } catch (error) {
        return {
          success: false,

          error:
            error instanceof Error
              ? error.message
              : "Notification SENDING recovery failed unexpectedly.",
        };
      }

      if (!sendingRecoveryResult.success) {
        return {
          success: false,

          error:
            sendingRecoveryResult.error,
        };
      }
    }

    // --------------------------------------------------------
    // PROCESS CURRENTLY DUE DELIVERIES
    // --------------------------------------------------------

    let processorResult:
      NotificationDeliveryProcessResult;

    try {
      processorResult =
        await this.dependencies.processor.processDue(
          scope,
          options,
        );
    } catch (error) {
      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Notification Delivery Processor failed unexpectedly.",
      };
    }

    // --------------------------------------------------------
    // RE-PLAN AFTER DELIVERY STATE MUTATIONS
    //
    // Examples:
    //
    // - OFFLINE may create a future nextRetryAt.
    // - Provider failure may create a future nextRetryAt.
    // - SENT / SKIPPED / exhausted FAILED records disappear
    //   from automatic wake planning.
    // --------------------------------------------------------

    let wakePlanResult:
      NotificationDeliveryWakePlanResult;

    try {
      wakePlanResult =
        await notificationDeliveryWakePlanner.plan(
          scope,
        );
    } catch (error) {
      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Notification Delivery wake planning failed unexpectedly.",

        report: {
          storageMode,

          ...(sendingRecoveryResult
            ? {
                sendingRecoveryResult,
              }
            : {}),

          processorResult,

          wakePlanResult: {
            success: false,

            error:
              "Notification Delivery wake planning failed unexpectedly.",
          },
        },
      };
    }

    const report:
      NotificationDeliveryExecutionReport = {
        storageMode,

        ...(sendingRecoveryResult
          ? {
              sendingRecoveryResult,
            }
          : {}),

        processorResult,

        wakePlanResult,
      };

    if (processorResult.errors > 0) {
      const processorErrors =
        processorResult.items
          .map((item) =>
            item.error,
          )
          .filter(
            (error):
              error is string =>
              Boolean(error),
          );

      return {
        success: false,

        error:
          processorErrors.length > 0
            ? processorErrors.join(" | ")
            : "Notification Delivery Processor completed with errors.",

        report,
      };
    }

    if (!wakePlanResult.success) {
      return {
        success: false,

        error:
          wakePlanResult.error,

        report,
      };
    }

    return {
      success: true,

      report,
    };
  }
}

/* ============================================================
   END
============================================================ */