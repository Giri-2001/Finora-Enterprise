// ============================================================
// FINORA ENTERPRISE OS(TM)
//
// NOTIFICATIONS ENGINE(TM)
// SCHEDULED LOAN NOTIFICATION SCHEDULER EXECUTION
//
// RESPONSIBILITY:
//
// - Enforce the scheduler storage execution boundary
// - Allow operational Notification generation only on LOCAL / USB
// - Require active storage to be READY
// - Load persisted Business Settings for the active business
// - Require a valid persisted IANA business time zone
// - Execute the scheduled Loan Notification runner
//
// IMPORTANT:
//
// - CLOUD is not an allowed operational Notification storage mode.
// - DEMO is a DataContext, not a StorageMode, and is not rejected here.
// - Missing / invalid time zone fails closed.
// - Device time zone is never used as an implicit fallback.
// - No timers.
// - No React.
// - No UI.
// - No provider calls.
// - No retry execution.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import {
  isSupportedBusinessTimeZone,
} from "../../../constants/business/businessTimeZone.constants";

import {
  businessSettingsService,
} from "../../business/businessService";

import type {
  ScheduledLoanNotificationGeneratorScope,
} from "../generation/scheduledLoanNotificationGenerator";

import {
  scheduledLoanNotificationSchedulerRunner,
} from "./scheduledLoanNotificationSchedulerRunner";

import type {
  ScheduledLoanNotificationSchedulerRunnerResult,
} from "./scheduledLoanNotificationSchedulerRunner";

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

/* ============================================================
   INPUT
============================================================ */

export interface ScheduledLoanNotificationSchedulerExecutionInput {
  scope:
    ScheduledLoanNotificationGeneratorScope;

  /**
   * Actual scheduler evaluation time.
   *
   * Defaults to Date.now() through the scheduler runner.
   */
  now?:
    string | number | Date;
}

/* ============================================================
   REPORT
============================================================ */

export interface ScheduledLoanNotificationSchedulerExecutionReport {
  storageMode:
    StorageMode;

  timeZone:
    string;

  runnerResult:
    ScheduledLoanNotificationSchedulerRunnerResult;
}

/* ============================================================
   RESULT
============================================================ */

export type ScheduledLoanNotificationSchedulerExecutionResult =
  | {
      success: true;

      report:
        ScheduledLoanNotificationSchedulerExecutionReport;
    }
  | {
      success: false;

      errorCode?:
        "BUSINESS_SETTINGS_NOT_CONFIGURED";

      error:
        string;

      report?:
        ScheduledLoanNotificationSchedulerExecutionReport;
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

export class ScheduledLoanNotificationSchedulerExecution {
  async run(
    input:
      ScheduledLoanNotificationSchedulerExecutionInput,

    options?:
      RepositoryWriteOptions,
  ): Promise<
    ScheduledLoanNotificationSchedulerExecutionResult
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
          "Owner ID is required for scheduled Loan Notification execution.",
      };
    }

    if (!scope.businessId) {
      return {
        success: false,

        error:
          "Business ID is required for scheduled Loan Notification execution.",
      };
    }

    if (!scope.branchId) {
      return {
        success: false,

        error:
          "Branch ID is required for scheduled Loan Notification execution.",
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
          "Active storage is not initialized for scheduled Loan Notification execution.",
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
          `Scheduled Loan Notifications are not allowed in storage mode ${storageMode}.`,
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
            : "Unable to read active storage status for scheduled Loan Notification execution.",
      };
    }

    if (
      storageStatus.availability !==
      StorageAvailability.READY
    ) {
      return {
        success: false,

        error:
          `Active ${storageMode} storage is not ready for scheduled Loan Notification execution.`,
      };
    }

    // --------------------------------------------------------
    // BUSINESS SETTINGS
    // --------------------------------------------------------

    let settingsResult;

    try {
      settingsResult =
        await businessSettingsService.load(
          scope.businessId,
        );
    } catch (error) {
      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to load Business Settings for scheduled Loan Notification execution.",
      };
    }

    if (!settingsResult.success) {
      return {
        success: false,

        error:
          settingsResult.error ??
          "Unable to load Business Settings for scheduled Loan Notification execution.",
      };
    }

    const settings =
      settingsResult.data;

    if (!settings) {
      return {
        success: false,

        errorCode:
          "BUSINESS_SETTINGS_NOT_CONFIGURED",

        error:
          "Business Settings are not configured for scheduled Loan Notification execution.",
      };
    }

    const settingsBusinessId =
      normalizeString(
        settings.businessId,
      );

    if (
      settingsBusinessId !==
      scope.businessId
    ) {
      return {
        success: false,

        error:
          "Business Settings scope does not match the active business for scheduled Loan Notification execution.",
      };
    }

    // --------------------------------------------------------
    // AUTHORITATIVE BUSINESS TIME ZONE
    // --------------------------------------------------------

    const timeZone =
      normalizeString(
        settings.timeZone,
      );

    if (!timeZone) {
      return {
        success: false,

        error:
          "Business time zone is not configured for scheduled Loan Notification execution.",
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
          "Business time zone is invalid for scheduled Loan Notification execution.",
      };
    }

    // --------------------------------------------------------
    // SCHEDULER RUNNER
    // --------------------------------------------------------

    let runnerResult:
      ScheduledLoanNotificationSchedulerRunnerResult;

    try {
      runnerResult =
        await scheduledLoanNotificationSchedulerRunner.run(
          {
            scope,

            timeZone,

            now:
              input.now,
          },

          options,
        );
    } catch (error) {
      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Scheduled Loan Notification runner failed unexpectedly.",
      };
    }

    const report:
      ScheduledLoanNotificationSchedulerExecutionReport = {
        storageMode,

        timeZone,

        runnerResult,
      };

    if (!runnerResult.success) {
      return {
        success: false,

        error:
          runnerResult.error,

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
   SINGLETON
============================================================ */

export const scheduledLoanNotificationSchedulerExecution =
  new ScheduledLoanNotificationSchedulerExecution();

/* ============================================================
   END
============================================================ */