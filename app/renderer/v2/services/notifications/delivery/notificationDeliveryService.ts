// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// NOTIFICATION DELIVERY SERVICE
//
// RESPONSIBILITY:
//
// - Execute one customer Notification delivery lifecycle.
// - Preserve delivery state before and after provider calls.
// - Prevent fake-success behavior while offline.
// - Resolve channel-specific recipient requirements.
// - Delegate provider work to channel adapters.
// - Delegate retry timing to an injected retry policy.
//
// IMPORTANT:
//
// - No React.
// - No UI.
// - No localStorage access.
// - No filesystem access.
// - No Electron IPC.
// - No provider secrets.
// - No hardcoded retry intervals.
// - No Loan eligibility rules.
// - No scheduler clock rules.
// - A provider call MUST NOT happen unless SENDING state
//   was persisted successfully first.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  NotificationDeliveryId,
  NotificationDeliveryRecord,
} from "../../../types/notifications/notification.types";

import {
  notificationDeliveryRepository,
} from "../../../repositories/notifications/notificationDeliveryRepository";

import {
  notificationRepository,
} from "../../../repositories/notifications/notificationRepository";

import {
  effectiveNotificationPolicyResolver,
} from "../preferences/effectiveNotificationPolicyResolver";

import type {
  EffectiveNotificationPolicyBlockReason,
} from "../preferences/effectiveNotificationPolicyResolver";

import type {
  NotificationDeliveryRepositoryScope,
} from "../../../repositories/notifications/notificationDeliveryRepository";

import type {
  RepositoryWriteOptions,
} from "../../../repositories/repository.types";

import type {
  NotificationChannelAdapterRegistry,
} from "./notificationChannelAdapter.types";

/* ============================================================
   CONNECTIVITY CONTRACT
============================================================ */

export interface NotificationConnectivity {
  isOnline(): boolean | Promise<boolean>;
}

/* ============================================================
   RETRY POLICY
============================================================ */

export type NotificationRetryReason =
  | "OFFLINE"
  | "PROVIDER_FAILURE"
  | "PROVIDER_EXCEPTION";

export interface NotificationRetryPolicyInput {
  delivery: NotificationDeliveryRecord;

  reason: NotificationRetryReason;

  now: string;
}

export interface NotificationRetryPolicy {
  /*
   * Return the next retry timestamp.
   *
   * undefined means no automatic retry should be scheduled.
   */

  getNextRetryAt(
    input: NotificationRetryPolicyInput,
  ): string | undefined;
}

/* ============================================================
   SERVICE DEPENDENCIES
============================================================ */

export interface NotificationDeliveryServiceDependencies {
  connectivity: NotificationConnectivity;

  adapters: NotificationChannelAdapterRegistry;

  retryPolicy: NotificationRetryPolicy;

  now?: () => string;
}

/* ============================================================
   EXECUTION REQUEST
============================================================ */

export interface NotificationDeliveryExecutionRequest {
  /*
   * Only durable identity crosses into the execution boundary.
   *
   * Delivery state and Notification content are reloaded from
   * repositories immediately before execution.
   */

  deliveryId: NotificationDeliveryId;
}

/* ============================================================
   EXECUTION RESULT
============================================================ */

export type NotificationDeliveryExecutionResult =
  | {
      success: true;

      delivery: NotificationDeliveryRecord;
    }
  | {
      success: false;

      delivery?: NotificationDeliveryRecord;

      error: string;
    };

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(
  value: string | undefined,
): string {
  return String(value ?? "").trim();
}

/* ============================================================
   EXECUTION STATE GUARD
============================================================ */

function isExecutionBlocked(
  delivery: NotificationDeliveryRecord,
): boolean {
  /*
   * Only SCHEDULED and FAILED deliveries may enter a new
   * provider attempt.
   *
   * SENDING is an in-flight/audit state and requires explicit
   * recovery handling before another provider call.
   *
   * SENT must never be sent again through normal execution.
   * Manual resend will use an explicit resend transition.
   */

  return (
    delivery.status === "SENDING" ||
    delivery.status === "SENT" ||
    delivery.status === "DELIVERED" ||
    delivery.status === "SKIPPED" ||
    delivery.status === "CANCELLED"
  );
}

/* ============================================================
   RECIPIENT VALIDATION
============================================================ */

function resolveRecipientError(
  delivery: NotificationDeliveryRecord,
): string | undefined {
  if (delivery.channel === "SMS") {
    if (!normalizeString(delivery.recipient.phoneNumber)) {
      return "Customer phone number is required for SMS delivery.";
    }

    return undefined;
  }

  if (delivery.channel === "WHATSAPP") {
    if (!normalizeString(delivery.recipient.whatsappNumber)) {
      return "Customer WhatsApp number is required for WhatsApp delivery.";
    }

    return undefined;
  }

  if (delivery.channel === "EMAIL") {
    if (!normalizeString(delivery.recipient.emailAddress)) {
      return "Customer email address is required for Email delivery.";
    }

    return undefined;
  }

  return "Notification delivery channel is unsupported.";
}

/* ============================================================
   POLICY BLOCK MESSAGE
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
   PERSIST UPDATED DELIVERY
============================================================ */

async function persistDelivery(
  scope: NotificationDeliveryRepositoryScope,

  delivery: NotificationDeliveryRecord,

  options?: RepositoryWriteOptions,
): Promise<NotificationDeliveryExecutionResult> {
  const updateResult =
    await notificationDeliveryRepository.update(
      scope,

      delivery,

      options,
    );

  if (!updateResult.success || !updateResult.data) {
    return {
      success: false,

      delivery,

      error:
        updateResult.error ??
        "Unable to persist Notification delivery state.",
    };
  }

  return {
    success: true,

    delivery: updateResult.data,
  };
}

/* ============================================================
   SERVICE
============================================================ */

export class NotificationDeliveryService {
  constructor(
    private readonly dependencies:
      NotificationDeliveryServiceDependencies,
  ) {}

  /* ==========================================================
     EXECUTE
  ========================================================== */

  async execute(
    scope: NotificationDeliveryRepositoryScope,

    request: NotificationDeliveryExecutionRequest,

    options?: RepositoryWriteOptions,
  ): Promise<NotificationDeliveryExecutionResult> {
    const now =
      this.dependencies.now?.() ??
      new Date().toISOString();

    /* --------------------------------------------------------
       AUTHORITATIVE DELIVERY LOAD

       Never execute from a caller-owned Delivery snapshot.
    -------------------------------------------------------- */

    const deliveryResult =
      await notificationDeliveryRepository.findById(
        scope,

        request.deliveryId,
      );

    if (!deliveryResult.success) {
      return {
        success: false,

        error:
          deliveryResult.error ??
          "Unable to load Notification delivery before execution.",
      };
    }

    if (!deliveryResult.data) {
      return {
        success: false,

        error:
          "Notification delivery was not found.",
      };
    }

    const delivery =
      deliveryResult.data;

    /* --------------------------------------------------------
       AUTHORITATIVE NOTIFICATION LOAD

       Title/message and logical ownership come only from the
       persisted canonical Notification record.
    -------------------------------------------------------- */

    const notificationResult =
      await notificationRepository.findById(
        scope,

        delivery.notificationId,
      );

    if (!notificationResult.success) {
      return {
        success: false,

        delivery,

        error:
          notificationResult.error ??
          "Unable to load canonical Notification before delivery.",
      };
    }

    if (!notificationResult.data) {
      return {
        success: false,

        delivery,

        error:
          "Canonical Notification was not found for this delivery.",
      };
    }

    const notification =
      notificationResult.data;

    if (notification.audience !== "CUSTOMER") {
      return {
        success: false,

        delivery,

        error:
          "Only CUSTOMER Notifications may use external delivery channels.",
      };
    }

    if (
      normalizeString(notification.source.customerId) !==
      normalizeString(delivery.recipient.customerId)
    ) {
      return {
        success: false,

        delivery,

        error:
          "Notification Customer does not match the delivery recipient.",
      };
    }

    /* --------------------------------------------------------
       EXECUTION STATE GUARD

       Normal provider execution is allowed only for:

       - SCHEDULED
       - FAILED

       This prevents duplicate provider sends from SENT records
       and prevents blind re-entry while a delivery is SENDING.
    -------------------------------------------------------- */

    if (isExecutionBlocked(delivery)) {
      return {
        success: false,

        delivery,

        error:
          `Notification delivery cannot execute from ${delivery.status} state.`,
      };
    }

    /* --------------------------------------------------------
       DELIVERY-TIME POLICY RE-CHECK

       Generation-time policy is not sufficient.

       Business policy or Customer preferences may change
       after a SCHEDULED / FAILED delivery was persisted.

       Re-resolve effective policy before adapter,
       connectivity, SENDING, or provider work.

       Explicit policy blocks become auditable SKIPPED
       deliveries using the same semantics as generation.
    -------------------------------------------------------- */

    const policyResult =
      await effectiveNotificationPolicyResolver.resolve(
        {
          ownerId:
            scope.ownerId,

          businessId:
            scope.businessId,

          branchId:
            scope.branchId,

          customerId:
            delivery.recipient.customerId,
        },

        {
          channel:
            delivery.channel,

          eventType:
            notification.eventType,
        },
      );

    if (
      !policyResult.success ||
      !policyResult.data
    ) {
      return {
        success: false,

        delivery,

        error:
          policyResult.error ??
          "Unable to re-check effective Notification policy before delivery.",
      };
    }

    const policyDecision =
      policyResult.data;

    if (!policyDecision.allowed) {
      const blockReason =
        policyDecision.blockReason;

      if (!blockReason) {
        return {
          success: false,

          delivery,

          error:
            "Notification delivery policy was blocked without a block reason.",
        };
      }

      const skippedDelivery:
        NotificationDeliveryRecord = {
          ...delivery,

          status:
            "SKIPPED",

          nextRetryAt:
            undefined,

          skippedAt:
            now,

          failureCode:
            blockReason,

          failureMessage:
            getPolicyBlockMessage(
              blockReason,
            ),

          updatedAt:
            now,
        };

      return persistDelivery(
        scope,

        skippedDelivery,

        options,
      );
    }
    /* --------------------------------------------------------
       CHANNEL ADAPTER
    -------------------------------------------------------- */

    const adapter =
      this.dependencies.adapters[delivery.channel];

    if (!adapter) {
      const failedDelivery: NotificationDeliveryRecord = {
        ...delivery,

        status: "FAILED",

        nextRetryAt: undefined,

        failureCode: "CHANNEL_ADAPTER_MISSING",

        failureMessage:
          `No ${delivery.channel} Notification adapter is registered.`,

        updatedAt: now,
      };

      return persistDelivery(
        scope,

        failedDelivery,

        options,
      );
    }

    if (adapter.channel !== delivery.channel) {
      const failedDelivery: NotificationDeliveryRecord = {
        ...delivery,

        status: "FAILED",

        nextRetryAt: undefined,

        failureCode: "CHANNEL_ADAPTER_MISMATCH",

        failureMessage:
          "Notification channel adapter does not match the delivery channel.",

        updatedAt: now,
      };

      return persistDelivery(
        scope,

        failedDelivery,

        options,
      );
    }

    /* --------------------------------------------------------
       RECIPIENT VALIDATION

       Missing recipient data is not a provider failure.
       The delivery is intentionally skipped and remains auditable.
    -------------------------------------------------------- */

    const recipientError =
      resolveRecipientError(delivery);

    if (recipientError) {
      const skippedDelivery: NotificationDeliveryRecord = {
        ...delivery,

        status: "SKIPPED",

        nextRetryAt: undefined,

        skippedAt: now,

        failureCode: "RECIPIENT_UNAVAILABLE",

        failureMessage: recipientError,

        updatedAt: now,
      };

      return persistDelivery(
        scope,

        skippedDelivery,

        options,
      );
    }

    /* --------------------------------------------------------
       ADAPTER CONFIGURATION
    -------------------------------------------------------- */

    let configured = false;

    try {
      configured =
        await adapter.isConfigured();
    } catch (error) {
      const failedDelivery: NotificationDeliveryRecord = {
        ...delivery,

        status: "FAILED",

        nextRetryAt: undefined,

        failureCode: "CHANNEL_CONFIGURATION_ERROR",

        failureMessage:
          error instanceof Error
            ? error.message
            : "Unable to verify Notification channel configuration.",

        updatedAt: now,
      };

      return persistDelivery(
        scope,

        failedDelivery,

        options,
      );
    }

    if (!configured) {
      const failedDelivery: NotificationDeliveryRecord = {
        ...delivery,

        status: "FAILED",

        nextRetryAt: undefined,

        failureCode: "CHANNEL_NOT_CONFIGURED",

        failureMessage:
          `${delivery.channel} Notification delivery is not configured.`,

        updatedAt: now,
      };

      return persistDelivery(
        scope,

        failedDelivery,

        options,
      );
    }

    /* --------------------------------------------------------
       CONNECTIVITY

       Offline is NOT an actual provider attempt.

       Therefore:
       - attemptCount does not increment
       - status does not become SENT
       - delivery stays SCHEDULED
       - nextRetryAt is policy-controlled
    -------------------------------------------------------- */

    let online = false;

    try {
      online =
        await this.dependencies.connectivity.isOnline();
    } catch {
      online = false;
    }

    if (!online) {
      const nextRetryAt =
        this.dependencies.retryPolicy.getNextRetryAt({
          delivery,

          reason: "OFFLINE",

          now,
        });

      const offlineDelivery: NotificationDeliveryRecord = {
        ...delivery,

        status: "SCHEDULED",

        nextRetryAt,

        failureCode: "OFFLINE",

        failureMessage:
          "Notification delivery is waiting for network connectivity.",

        updatedAt: now,
      };

      return persistDelivery(
        scope,

        offlineDelivery,

        options,
      );
    }

    /* --------------------------------------------------------
       PERSIST SENDING BEFORE PROVIDER CALL

       This is a fail-closed audit boundary.

       If SENDING cannot be persisted, provider delivery MUST
       NOT execute because an outbound message would otherwise
       exist without a durable local audit state.
    -------------------------------------------------------- */

    const sendingDelivery: NotificationDeliveryRecord = {
      ...delivery,

      status: "SENDING",

      attemptCount:
        delivery.attemptCount + 1,

      lastAttemptAt: now,

      nextRetryAt: undefined,

      failureCode: undefined,

      failureMessage: undefined,

      updatedAt: now,
    };

    const sendingResult =
      await persistDelivery(
        scope,

        sendingDelivery,

        options,
      );

    if (!sendingResult.success) {
      return sendingResult;
    }

    /* --------------------------------------------------------
       PROVIDER ATTEMPT
    -------------------------------------------------------- */

    try {
      const outcome =
        await adapter.send({
          notificationId:
            sendingDelivery.notificationId,

          deliveryId:
            sendingDelivery.id,

          channel:
            sendingDelivery.channel,

          title:
            notification.title,

          message:
            notification.message,

          customerId:
            sendingDelivery.recipient.customerId,

          customerName:
            sendingDelivery.recipient.customerName,

          phoneNumber:
            sendingDelivery.recipient.phoneNumber,

          whatsappNumber:
            sendingDelivery.recipient.whatsappNumber,

          emailAddress:
            sendingDelivery.recipient.emailAddress,
        });

      if (outcome.success) {
        const sentDelivery: NotificationDeliveryRecord = {
          ...sendingDelivery,

          status: "SENT",

          providerMessageId:
            normalizeString(
              outcome.providerMessageId,
            ) || undefined,

          sentAt:
            normalizeString(
              outcome.acceptedAt,
            ) || now,

          nextRetryAt: undefined,

          failureCode: undefined,

          failureMessage: undefined,

          updatedAt: now,
        };

        return persistDelivery(
          scope,

          sentDelivery,

          options,
        );
      }

      const nextRetryAt =
        outcome.retryable
          ? this.dependencies.retryPolicy.getNextRetryAt({
              delivery: sendingDelivery,

              reason: "PROVIDER_FAILURE",

              now,
            })
          : undefined;

      const failedDelivery: NotificationDeliveryRecord = {
        ...sendingDelivery,

        status: "FAILED",

        nextRetryAt,

        failureCode:
          normalizeString(
            outcome.failureCode,
          ) || "PROVIDER_FAILURE",

        failureMessage:
          normalizeString(
            outcome.failureMessage,
          ) || "Notification provider rejected the delivery.",

        updatedAt: now,
      };

      return persistDelivery(
        scope,

        failedDelivery,

        options,
      );
    } catch (error) {
      const nextRetryAt =
        this.dependencies.retryPolicy.getNextRetryAt({
          delivery: sendingDelivery,

          reason: "PROVIDER_EXCEPTION",

          now,
        });

      const failedDelivery: NotificationDeliveryRecord = {
        ...sendingDelivery,

        status: "FAILED",

        nextRetryAt,

        failureCode: "PROVIDER_EXCEPTION",

        failureMessage:
          error instanceof Error
            ? error.message
            : "Notification provider delivery failed unexpectedly.",

        updatedAt: now,
      };

      return persistDelivery(
        scope,

        failedDelivery,

        options,
      );
    }
  }
}

/* ============================================================
   END
============================================================ */
