// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// SCHEDULED LOAN NOTIFICATION GENERATOR
//
// RESPONSIBILITY:
//
// - Persist Owner scheduled Loan Notifications.
// - Persist Customer logical scheduled Loan Notifications.
// - Resolve authoritative Customer recipient + language.
// - Resolve effective Business / Customer channel policy.
// - Create deterministic initial Delivery records.
// - Preserve restart / catch-up idempotency.
// - Recover safely from partial generation.
//
// IMPORTANT:
//
// - No Loan storage loading.
// - No Loan rule evaluation.
// - No scheduler clock calculation.
// - No provider calls.
// - No retry execution.
// - No UI.
// - No random IDs.
// - Existing deterministic records are never reset.
// - Policy storage failures are never converted into fake SKIPPED.
// - Owner Notification generation remains independent from
//   Customer recipient / delivery failures.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  CustomerNotificationChannel,
  CustomerNotificationRecord,
  NotificationDeliveryRecord,
  NotificationRecord,
  OwnerNotificationRecord,
} from "../../../types/notifications/notification.types";

import {
  NOTIFICATION_DELIVERY_ENTITY,
  NOTIFICATION_ENTITY,
} from "../../../types/notifications/notification.types";

import type {
  LoanNotificationRuleMatch,
} from "../rules/loanNotificationRulesEngine";

import {
  notificationRepository,
} from "../../../repositories/notifications/notificationRepository";

import {
  notificationDeliveryRepository,
} from "../../../repositories/notifications/notificationDeliveryRepository";

import {
  customerNotificationRecipientResolver,
} from "../recipients/customerNotificationRecipientResolver";

import {
  effectiveNotificationPolicyResolver,
} from "../preferences/effectiveNotificationPolicyResolver";

import type {
  EffectiveNotificationPolicyBlockReason,
} from "../preferences/effectiveNotificationPolicyResolver";

import {
  buildInitialNotificationDeliveryId,
  buildScheduledLoanNotificationId,
} from "./notificationGenerationIdentity";

import type {
  ScheduledNotificationSlot,
} from "./notificationGenerationIdentity";

import {
  buildScheduledLoanNotificationContent,
  buildScheduledLoanOwnerNotificationContent,
} from "./scheduledLoanNotificationContentBuilder";

import {
  resolveScheduledLoanNotificationPriority,
} from "./scheduledLoanNotificationPriority";

import {
  emitNotificationDataChanged,
} from "../notificationDataChangeSignal";

import type {
  RepositoryWriteOptions,
} from "../../../repositories/repository.types";

/* ============================================================
   SCOPE
============================================================ */

export interface ScheduledLoanNotificationGeneratorScope {
  ownerId: string;

  businessId: string;

  branchId: string;
}

/* ============================================================
   INPUT
============================================================ */

export interface ScheduledLoanNotificationGeneratorInput {
  scope:
    ScheduledLoanNotificationGeneratorScope;

  match:
    LoanNotificationRuleMatch;

  /**
   * Business-local calendar identity.
   *
   * YYYY-MM-DD.
   */
  calendarDate: string;

  slot:
    ScheduledNotificationSlot;

  /**
   * Actual scheduler-slot timestamp.
   *
   * Scheduler owns the 09:00 / 20:00 mapping.
   */
  scheduledFor: string;

  /**
   * Timestamp used for durable createdAt / updatedAt metadata.
   *
   * Injected by the orchestrator for deterministic testing.
   */
  generatedAt: string;
}

/* ============================================================
   ARTIFACT STATE
============================================================ */

export type ScheduledNotificationArtifactState =
  | "CREATED"
  | "EXISTING"
  | "NOT_CREATED";

/* ============================================================
   NOTIFICATION ARTIFACT
============================================================ */

export interface ScheduledNotificationArtifactReport {
  notificationId: string;

  state:
    ScheduledNotificationArtifactState;

  error?: string;
}

/* ============================================================
   DELIVERY ARTIFACT
============================================================ */

export interface ScheduledNotificationDeliveryArtifactReport {
  channel:
    CustomerNotificationChannel;

  deliveryId: string;

  state:
    ScheduledNotificationArtifactState;

  status?:
    NotificationDeliveryRecord["status"];

  policyAllowed?: boolean;

  policyBlockReason?:
    EffectiveNotificationPolicyBlockReason;

  error?: string;
}

/* ============================================================
   REPORT
============================================================ */

export interface ScheduledLoanNotificationGenerationReport {
  owner:
    ScheduledNotificationArtifactReport;

  customer:
    ScheduledNotificationArtifactReport;

  recipientResolved: boolean;

  deliveries:
    ScheduledNotificationDeliveryArtifactReport[];

  errors: string[];
}

/* ============================================================
   RESULT
============================================================ */

export type ScheduledLoanNotificationGenerationResult =
  | {
      success: true;

      report:
        ScheduledLoanNotificationGenerationReport;
    }
  | {
      success: false;

      error: string;

      report?:
        ScheduledLoanNotificationGenerationReport;
    };

/* ============================================================
   INTERNAL ENSURE RESULT
============================================================ */

type EnsureRecordResult<TRecord> =
  | {
      success: true;

      state:
        Exclude<
          ScheduledNotificationArtifactState,
          "NOT_CREATED"
        >;

      record: TRecord;
    }
  | {
      success: false;

      error: string;
    };

/* ============================================================
   CHANNELS
============================================================ */

const CUSTOMER_CHANNELS:
  readonly CustomerNotificationChannel[] = [
    "SMS",
    "WHATSAPP",
    "EMAIL",
  ];

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(
  value: unknown,
): string {
  return String(value ?? "").trim();
}

function normalizeScope(
  scope:
    ScheduledLoanNotificationGeneratorScope,
): ScheduledLoanNotificationGeneratorScope {
  return {
    ownerId:
      normalizeString(scope.ownerId),

    businessId:
      normalizeString(scope.businessId),

    branchId:
      normalizeString(scope.branchId),
  };
}

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
   POLICY MESSAGE
============================================================ */

function getPolicyBlockMessage(
  reason:
    EffectiveNotificationPolicyBlockReason,
): string {
  switch (reason) {
    case "MISSING_BUSINESS_POLICY":
      return "Business Notification policy is not configured.";

    case "BUSINESS_DISABLED":
      return "Business customer Notifications are disabled.";

    case "BUSINESS_CHANNEL_DISABLED":
      return "This customer Notification channel is disabled by Business policy.";

    case "BUSINESS_EVENT_DISABLED":
      return "This Notification event is disabled by Business policy.";

    case "CUSTOMER_CHANNEL_DISABLED":
      return "This Notification channel is disabled for the Customer.";

    case "CUSTOMER_EVENT_DISABLED":
      return "This Notification event is disabled for the Customer.";
  }
}

/* ============================================================
   NOTIFICATION IDENTITY CONSISTENCY
============================================================ */

function notificationMatchesExpectedIdentity(
  existing: NotificationRecord,

  expected: NotificationRecord,
): boolean {
  return (
    normalizeString(existing.id) ===
      normalizeString(expected.id) &&
    normalizeString(existing.notificationId) ===
      normalizeString(expected.notificationId) &&
    existing.entity ===
      NOTIFICATION_ENTITY &&
    normalizeString(existing.ownerId) ===
      normalizeString(expected.ownerId) &&
    normalizeString(existing.businessId) ===
      normalizeString(expected.businessId) &&
    normalizeString(existing.branchId) ===
      normalizeString(expected.branchId) &&
    existing.audience ===
      expected.audience &&
    existing.eventType ===
      expected.eventType &&
    normalizeString(existing.source.customerId) ===
      normalizeString(expected.source.customerId) &&
    normalizeString(existing.source.loanId) ===
      normalizeString(expected.source.loanId)
  );
}

/* ============================================================
   DELIVERY IDENTITY CONSISTENCY
============================================================ */

function deliveryMatchesExpectedIdentity(
  existing: NotificationDeliveryRecord,

  expected: NotificationDeliveryRecord,
): boolean {
  return (
    normalizeString(existing.id) ===
      normalizeString(expected.id) &&
    existing.entity ===
      NOTIFICATION_DELIVERY_ENTITY &&
    normalizeString(existing.notificationId) ===
      normalizeString(expected.notificationId) &&
    normalizeString(existing.ownerId) ===
      normalizeString(expected.ownerId) &&
    normalizeString(existing.businessId) ===
      normalizeString(expected.businessId) &&
    normalizeString(existing.branchId) ===
      normalizeString(expected.branchId) &&
    existing.channel ===
      expected.channel &&
    normalizeString(existing.recipient.customerId) ===
      normalizeString(expected.recipient.customerId)
  );
}

/* ============================================================
   ENSURE NOTIFICATION
============================================================ */

async function ensureNotification(
  scope:
    ScheduledLoanNotificationGeneratorScope,

  notification:
    NotificationRecord,

  options?:
    RepositoryWriteOptions,
): Promise<
  EnsureRecordResult<NotificationRecord>
> {
  const existingResult =
    await notificationRepository.findById(
      scope,

      notification.id,
    );

  if (!existingResult.success) {
    return {
      success: false,

      error:
        existingResult.error ??
        "Unable to verify existing scheduled Notification.",
    };
  }

  if (existingResult.data) {
    if (
      !notificationMatchesExpectedIdentity(
        existingResult.data,

        notification,
      )
    ) {
      return {
        success: false,

        error:
          `Scheduled Notification identity collision for ${notification.id}.`,
      };
    }

    return {
      success: true,

      state: "EXISTING",

      record:
        existingResult.data,
    };
  }

  const saveResult =
    await notificationRepository.save(
      scope,

      notification,

      options,
    );

  if (
    saveResult.success &&
    saveResult.data
  ) {
    return {
      success: true,

      state: "CREATED",

      record:
        saveResult.data,
    };
  }

  /*
   * A same-ID concurrent / repeated generation may have
   * completed between FIND and SAVE.
   *
   * Re-read once and accept only an identity-compatible record.
   */

  const recoveryResult =
    await notificationRepository.findById(
      scope,

      notification.id,
    );

  const recoveredNotification =
    recoveryResult.data;

  if (
    recoveryResult.success &&
    recoveredNotification &&
    notificationMatchesExpectedIdentity(
      recoveredNotification,

      notification,
    )
  ) {
    return {
      success: true,

      state: "EXISTING",

      record:
        recoveredNotification,
    };
  }

  return {
    success: false,

    error:
      saveResult.error ??
      recoveryResult.error ??
      "Unable to save scheduled Notification.",
  };
}

/* ============================================================
   ENSURE DELIVERY
============================================================ */

async function ensureDelivery(
  scope:
    ScheduledLoanNotificationGeneratorScope,

  delivery:
    NotificationDeliveryRecord,

  options?:
    RepositoryWriteOptions,
): Promise<
  EnsureRecordResult<NotificationDeliveryRecord>
> {
  const existingResult =
    await notificationDeliveryRepository.findById(
      scope,

      delivery.id,
    );

  if (!existingResult.success) {
    return {
      success: false,

      error:
        existingResult.error ??
        "Unable to verify existing scheduled Notification delivery.",
    };
  }

  if (existingResult.data) {
    if (
      !deliveryMatchesExpectedIdentity(
        existingResult.data,

        delivery,
      )
    ) {
      return {
        success: false,

        error:
          `Notification Delivery identity collision for ${delivery.id}.`,
      };
    }

    return {
      success: true,

      state: "EXISTING",

      record:
        existingResult.data,
    };
  }

  const saveResult =
    await notificationDeliveryRepository.save(
      scope,

      delivery,

      options,
    );

  if (
    saveResult.success &&
    saveResult.data
  ) {
    return {
      success: true,

      state: "CREATED",

      record:
        saveResult.data,
    };
  }

  const recoveryResult =
    await notificationDeliveryRepository.findById(
      scope,

      delivery.id,
    );

  const recoveredDelivery =
    recoveryResult.data;

  if (
    recoveryResult.success &&
    recoveredDelivery &&
    deliveryMatchesExpectedIdentity(
      recoveredDelivery,

      delivery,
    )
  ) {
    return {
      success: true,

      state: "EXISTING",

      record:
        recoveredDelivery,
    };
  }

  return {
    success: false,

    error:
      saveResult.error ??
      recoveryResult.error ??
      "Unable to save scheduled Notification delivery.",
  };
}

/* ============================================================
   REPORT RESULT
============================================================ */

function finalizeReport(
  report:
    ScheduledLoanNotificationGenerationReport,
): ScheduledLoanNotificationGenerationResult {
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
   GENERATOR
============================================================ */

export class ScheduledLoanNotificationGenerator {
  async generate(
    input:
      ScheduledLoanNotificationGeneratorInput,

    options?:
      RepositoryWriteOptions,
  ): Promise<
    ScheduledLoanNotificationGenerationResult
  > {
    const scope =
      normalizeScope(
        input.scope,
      );

    if (!scope.ownerId) {
      return {
        success: false,

        error:
          "Owner ID is required for scheduled Loan Notification generation.",
      };
    }

    if (!scope.businessId) {
      return {
        success: false,

        error:
          "Business ID is required for scheduled Loan Notification generation.",
      };
    }

    if (!scope.branchId) {
      return {
        success: false,

        error:
          "Branch ID is required for scheduled Loan Notification generation.",
      };
    }

    if (!isValidTimestamp(input.scheduledFor)) {
      return {
        success: false,

        error:
          "Scheduled-for timestamp is invalid for scheduled Loan Notification generation.",
      };
    }

    if (!isValidTimestamp(input.generatedAt)) {
      return {
        success: false,

        error:
          "Generation timestamp is invalid for scheduled Loan Notification generation.",
      };
    }

    const customerId =
      normalizeString(
        input.match.source.customerId,
      );

    const loanId =
      normalizeString(
        input.match.source.loanId,
      );

    if (!customerId) {
      return {
        success: false,

        error:
          "Customer ID is required for scheduled Loan Notification generation.",
      };
    }

    if (!loanId) {
      return {
        success: false,

        error:
          "Loan ID is required for scheduled Loan Notification generation.",
      };
    }

    /* ========================================================
       DETERMINISTIC NOTIFICATION IDENTITIES
    ======================================================== */

    const ownerIdentity =
      buildScheduledLoanNotificationId({
        ...scope,

        audience:
          "OWNER",

        customerId,

        loanId,

        eventType:
          input.match.eventType,

        calendarDate:
          input.calendarDate,

        slot:
          input.slot,
      });

    if (!ownerIdentity.success) {
      return {
        success: false,

        error:
          ownerIdentity.error,
      };
    }

    const customerIdentity =
      buildScheduledLoanNotificationId({
        ...scope,

        audience:
          "CUSTOMER",

        customerId,

        loanId,

        eventType:
          input.match.eventType,

        calendarDate:
          input.calendarDate,

        slot:
          input.slot,
      });

    if (!customerIdentity.success) {
      return {
        success: false,

        error:
          customerIdentity.error,
      };
    }

    const report:
      ScheduledLoanNotificationGenerationReport = {
        owner: {
          notificationId:
            ownerIdentity.id,

          state:
            "NOT_CREATED",
        },

        customer: {
          notificationId:
            customerIdentity.id,

          state:
            "NOT_CREATED",
        },

        recipientResolved:
          false,

        deliveries: [],

        errors: [],
      };

    /* ========================================================
       AUTHORITATIVE CUSTOMER RESOLUTION

       Failure here does NOT block Owner generation.
    ======================================================== */

    const recipientResolution =
      await customerNotificationRecipientResolver.resolve(
        customerId,
      );

    const resolvedCustomerName =
      recipientResolution.success
        ? recipientResolution.recipient.customerName
        : undefined;

    /* ========================================================
       OWNER CONTENT
    ======================================================== */

    const ownerContentResult =
      buildScheduledLoanOwnerNotificationContent({
        eventType:
          input.match.eventType,

        customerId,

        customerName:
          resolvedCustomerName,

        loanNumber:
          input.match.source.loanNumber,

        dueAt:
          input.match.dueAt,

        loanOutstanding:
          input.match.loanOutstanding,

        installmentRemainingTotal:
          input.match.installmentRemainingTotal,
      });

    if (!ownerContentResult.success) {
      return {
        success: false,

        error:
          ownerContentResult.error,

        report,
      };
    }

    const priority =
      resolveScheduledLoanNotificationPriority(
        input.match.eventType,
      );

    const ownerNotification:
      OwnerNotificationRecord = {
        id:
          ownerIdentity.id,

        notificationId:
          ownerIdentity.id,

        entity:
          NOTIFICATION_ENTITY,

        ...scope,

        audience:
          "OWNER",

        eventType:
          input.match.eventType,

        priority,

        title:
          ownerContentResult.content.title,

        message:
          ownerContentResult.content.message,

        source:
          input.match.source,

        readState:
          "UNREAD",

        scheduledFor:
          input.scheduledFor,

        createdAt:
          input.generatedAt,

        updatedAt:
          input.generatedAt,
      };

    const ownerEnsure =
      await ensureNotification(
        scope,

        ownerNotification,

        options,
      );

    if (ownerEnsure.success) {
      report.owner.state =
        ownerEnsure.state;

      if (ownerEnsure.state === "CREATED") {
        emitNotificationDataChanged({
          ownerId:
            ownerEnsure.record.ownerId,

          businessId:
            ownerEnsure.record.businessId,

          branchId:
            ownerEnsure.record.branchId,

          resource:
            "NOTIFICATION",

          operation:
            "CREATED",

          notificationId:
            ownerEnsure.record.id,
        });
      }
    } else {
      report.owner.error =
        ownerEnsure.error;

      report.errors.push(
        ownerEnsure.error,
      );
    }

    /* ========================================================
       CUSTOMER RESOLUTION FAILURE

       Owner generation has already been attempted.
       Customer notification / deliveries remain absent and may
       be recovered by the same deterministic slot on rerun.
    ======================================================== */

    if (!recipientResolution.success) {
      const error =
        recipientResolution.error;

      report.customer.error =
        error;

      report.errors.push(
        error,
      );

      return finalizeReport(
        report,
      );
    }

    report.recipientResolved =
      true;

    /* ========================================================
       CUSTOMER CONTENT
    ======================================================== */

    const customerContentResult =
      buildScheduledLoanNotificationContent({
        eventType:
          input.match.eventType,

        customerId,

        customerName:
          recipientResolution.recipient.customerName,

        loanNumber:
          input.match.source.loanNumber,

        dueAt:
          input.match.dueAt,

        loanOutstanding:
          input.match.loanOutstanding,

        installmentRemainingTotal:
          input.match.installmentRemainingTotal,

        preferredLanguage:
          recipientResolution.preferredLanguage,
      });

    if (!customerContentResult.success) {
      report.customer.error =
        customerContentResult.error;

      report.errors.push(
        customerContentResult.error,
      );

      return finalizeReport(
        report,
      );
    }

    const templateLoanNumber =
      normalizeString(
        input.match.source.loanNumber,
      );

    const templateDueAt =
      normalizeString(
        input.match.dueAt,
      );

    const templateDueAmount =
      input.match.installmentRemainingTotal > 0
        ? input.match.installmentRemainingTotal
        : input.match.loanOutstanding;

    const templateResolvedLanguage =
      customerContentResult.content.customer.resolvedLanguage;
    const customerNotification:
      CustomerNotificationRecord = {
        id:
          customerIdentity.id,

        notificationId:
          customerIdentity.id,

        entity:
          NOTIFICATION_ENTITY,

        ...scope,

        audience:
          "CUSTOMER",

        eventType:
          input.match.eventType,

        priority,

        title:
          customerContentResult.content.customer.title,

        message:
          customerContentResult.content.customer.message,

        source:
          input.match.source,

        templateContext: {
          templateKey:
            `SCHEDULED_LOAN::${input.match.eventType}::${templateResolvedLanguage.toUpperCase()}`,

          requestedLanguage:
            customerContentResult.content.customer.requestedLanguage,

          resolvedLanguage:
            templateResolvedLanguage,

          variables: {
            ...(templateLoanNumber
              ? {
                  loanNumber:
                    templateLoanNumber,
                }
              : {}),

            dueAt:
              templateDueAt,

            dueAmount:
              String(
                templateDueAmount,
              ),

            outstandingAmount:
              String(
                input.match.loanOutstanding,
              ),
          },

          schemaVersion:
            1,
        },

        scheduledFor:
          input.scheduledFor,

        createdAt:
          input.generatedAt,

        updatedAt:
          input.generatedAt,
      };

    const customerEnsure =
      await ensureNotification(
        scope,

        customerNotification,

        options,
      );

    if (customerEnsure.success) {
      report.customer.state =
        customerEnsure.state;
    } else {
      report.customer.error =
        customerEnsure.error;

      report.errors.push(
        customerEnsure.error,
      );

      /*
       * Deliveries cannot safely exist without their canonical
       * Customer Notification parent.
       */

      return finalizeReport(
        report,
      );
    }

    /* ========================================================
       INITIAL CUSTOMER DELIVERIES
    ======================================================== */

    for (
      const channel
      of CUSTOMER_CHANNELS
    ) {
      const deliveryIdentity =
        buildInitialNotificationDeliveryId({
          notificationId:
            customerIdentity.id,

          channel,
        });

      if (!deliveryIdentity.success) {
        const error =
          deliveryIdentity.error;

        report.deliveries.push({
          channel,

          deliveryId: "",

          state:
            "NOT_CREATED",

          error,
        });

        report.errors.push(
          error,
        );

        continue;
      }

      /* ------------------------------------------------------
         EFFECTIVE POLICY

         Repository/storage errors are NOT policy blocks.
         They leave the deterministic delivery absent so the
         next generation rerun may recover it.
      ------------------------------------------------------ */

      const policyResult =
        await effectiveNotificationPolicyResolver.resolve(
          {
            ...scope,

            customerId,
          },

          {
            channel,

            eventType:
              input.match.eventType,
          },
        );

      if (!policyResult.success) {
        const error =
          policyResult.error ??
          `Unable to resolve ${channel} Notification policy.`;

        report.deliveries.push({
          channel,

          deliveryId:
            deliveryIdentity.id,

          state:
            "NOT_CREATED",

          error,
        });

        report.errors.push(
          error,
        );

        continue;
      }

      if (!policyResult.data) {
        const error =
          `${channel} Notification policy resolver returned no decision.`;

        report.deliveries.push({
          channel,

          deliveryId:
            deliveryIdentity.id,

          state:
            "NOT_CREATED",

          error,
        });

        report.errors.push(
          error,
        );

        continue;
      }

      const policyDecision =
        policyResult.data;

      const blockedReason =
        policyDecision.allowed
          ? undefined
          : policyDecision.blockReason;

      /*
       * blockedReason should always exist when allowed=false.
       * Treat an impossible missing reason as a resolver error,
       * never as permission to send.
       */

      if (
        !policyDecision.allowed &&
        !blockedReason
      ) {
        const error =
          `${channel} Notification policy blocked delivery without a block reason.`;

        report.deliveries.push({
          channel,

          deliveryId:
            deliveryIdentity.id,

          state:
            "NOT_CREATED",

          policyAllowed:
            false,

          error,
        });

        report.errors.push(
          error,
        );

        continue;
      }

      const delivery:
        NotificationDeliveryRecord = {
          id:
            deliveryIdentity.id,

          entity:
            NOTIFICATION_DELIVERY_ENTITY,

          notificationId:
            customerIdentity.id,

          ...scope,

          channel,

          recipient:
            recipientResolution.recipient,

          status:
            policyDecision.allowed
              ? "SCHEDULED"
              : "SKIPPED",

          attemptCount:
            0,

          ...(!policyDecision.allowed &&
          blockedReason
            ? {
                skippedAt:
                  input.generatedAt,

                failureCode:
                  blockedReason,

                failureMessage:
                  getPolicyBlockMessage(
                    blockedReason,
                  ),
              }
            : {}),

          createdAt:
            input.generatedAt,

          updatedAt:
            input.generatedAt,
        };

      const deliveryEnsure =
        await ensureDelivery(
          scope,

          delivery,

          options,
        );

      if (!deliveryEnsure.success) {
        const error =
          deliveryEnsure.error;

        report.deliveries.push({
          channel,

          deliveryId:
            deliveryIdentity.id,

          state:
            "NOT_CREATED",

          policyAllowed:
            policyDecision.allowed,

          ...(blockedReason
            ? {
                policyBlockReason:
                  blockedReason,
              }
            : {}),

          error,
        });

        report.errors.push(
          error,
        );

        continue;
      }

      if (deliveryEnsure.state === "CREATED") {
        emitNotificationDataChanged({
          ownerId:
            deliveryEnsure.record.ownerId,

          businessId:
            deliveryEnsure.record.businessId,

          branchId:
            deliveryEnsure.record.branchId,

          resource:
            "DELIVERY",

          operation:
            "CREATED",

          notificationId:
            deliveryEnsure.record.notificationId,

          deliveryId:
            deliveryEnsure.record.id,
        });
      }

      report.deliveries.push({
        channel,

        deliveryId:
          deliveryIdentity.id,

        state:
          deliveryEnsure.state,

        status:
          deliveryEnsure.record.status,

        policyAllowed:
          policyDecision.allowed,

        ...(blockedReason
          ? {
              policyBlockReason:
                blockedReason,
            }
          : {}),
      });
    }

    return finalizeReport(
      report,
    );
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const scheduledLoanNotificationGenerator =
  new ScheduledLoanNotificationGenerator();

/* ============================================================
   END
============================================================ */
