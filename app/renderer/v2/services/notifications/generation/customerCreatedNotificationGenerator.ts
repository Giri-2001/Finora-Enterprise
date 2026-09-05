// ============================================================
// FINORA ENTERPRISE OS
//
// NOTIFICATIONS ENGINE
// CUSTOMER CREATED NOTIFICATION GENERATOR
//
// RESPONSIBILITY:
//
// - Generate one deterministic CUSTOMER_CREATED Notification.
// - Use the persisted Customer creation timestamp.
// - Resolve the persisted Business time zone.
// - Convert createdAt to the business-local calendar date.
// - Resolve the authoritative Customer delivery recipient.
// - Resolve effective Business / Customer delivery policy.
// - Create deterministic initial SMS / WhatsApp / Email records.
// - Preserve restart / repeated-call idempotency.
// - Recover safely from same-ID concurrent generation.
//
// IMPORTANT:
//
// - No provider calls.
// - No UI.
// - No device-local date fallback.
// - No random Notification or Delivery IDs.
// - Existing deterministic records are never reset.
// - Policy storage errors are never converted into fake SKIPPED.
// - Missing / invalid Business time zone fails generation.
// - CUSTOMER_CREATED is immediate, therefore scheduledFor is the
//   supplied generation timestamp.
// - Customer ID-card media attachment is handled separately by
//   the provider/media contract and is not faked here.
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
  NotificationMediaArtifactReference,
  NotificationRecord,
} from "../../../types/notifications/notification.types";

import {
  NOTIFICATION_DELIVERY_ENTITY,
  NOTIFICATION_ENTITY,
} from "../../../types/notifications/notification.types";

import type {
  CustomerProfile,
} from "../../../types/customers";

import type {
  FinoraProvisionedBusinessProfileV1,
} from "../../../types/business/finoraBusinessProfileControl.types";

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
  buildCustomerCreatedNotificationId,
  buildInitialNotificationDeliveryId,
} from "./notificationGenerationIdentity";

import {
  buildCustomerCreatedNotificationContent,
} from "./customerCreatedNotificationContentBuilder";

import {
  businessSettingsService,
} from "../../business/businessService";

import {
  getBusinessCalendarDate,
} from "../scheduler/scheduledNotificationClock";

import {
  emitNotificationDataChanged,
} from "../notificationDataChangeSignal";

import type {
  RepositoryWriteOptions,
} from "../../../repositories/repository.types";

/* ============================================================
   SCOPE
============================================================ */

export interface CustomerCreatedNotificationGeneratorScope {
  ownerId: string;

  businessId: string;

  branchId: string;
}

/* ============================================================
   INPUT
============================================================ */

export interface CustomerCreatedNotificationGeneratorInput {
  /**
   * Customer returned by successful Customer persistence.
   */
  customer: CustomerProfile;

  /**
   * Authoritative signed FINORA Business Profile resolved by the creation flow.
   */
  businessIdentity:
    FinoraProvisionedBusinessProfileV1;

  /**
   * Notification generation metadata timestamp.
   *
   * This is NOT used as the Customer-added date.
   */
  generatedAt: string;

  /**
   * Optional durable snapshot of the canonical FINORA
   * Customer ID Card artifact.
   *
   * The reference contains no binary payload or filesystem path.
   * SMS ignores this media. WhatsApp and Email may reuse the
   * same durable artifact.
   */
  mediaArtifact?:
    NotificationMediaArtifactReference;
}

/* ============================================================
   ARTIFACT STATE
============================================================ */

export type CustomerCreatedNotificationArtifactState =
  | "CREATED"
  | "EXISTING"
  | "NOT_CREATED";

/* ============================================================
   DELIVERY REPORT
============================================================ */

export interface CustomerCreatedDeliveryArtifactReport {
  channel:
    CustomerNotificationChannel;

  deliveryId: string;

  state:
    CustomerCreatedNotificationArtifactState;

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

export interface CustomerCreatedNotificationGenerationReport {
  notificationId: string;

  notificationState:
    CustomerCreatedNotificationArtifactState;

  recipientResolved: boolean;

  businessTimeZone?: string;

  createdCalendarDate?: string;

  deliveries:
    CustomerCreatedDeliveryArtifactReport[];

  errors: string[];
}

/* ============================================================
   RESULT
============================================================ */

export type CustomerCreatedNotificationGenerationResult =
  | {
      success: true;

      report:
        CustomerCreatedNotificationGenerationReport;
    }
  | {
      success: false;

      error: string;

      report?:
        CustomerCreatedNotificationGenerationReport;
    };

/* ============================================================
   INTERNAL ENSURE RESULT
============================================================ */

type EnsureRecordResult<TRecord> =
  | {
      success: true;

      state:
        Exclude<
          CustomerCreatedNotificationArtifactState,
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
  identity:
      FinoraProvisionedBusinessProfileV1,
  ): CustomerCreatedNotificationGeneratorScope {
  return {
    ownerId:
      normalizeString(
        identity.ownerId,
      ),

    businessId:
      normalizeString(
        identity.businessId,
      ),

    branchId:
      normalizeString(
        identity.branchId,
      ),
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
   CUSTOMER-CREATED MEDIA ARTIFACT VALIDATION
============================================================ */

function validateCustomerCreatedMediaArtifact(
  artifact:
    NotificationMediaArtifactReference,

  scope:
    CustomerCreatedNotificationGeneratorScope,
): string | undefined {
  const artifactId =
    normalizeString(
      artifact.artifactId,
    );

  if (!artifactId) {
    return "Customer-created Notification media artifact ID is required.";
  }

  if (
    artifact.kind !==
    "CUSTOMER_ID_CARD"
  ) {
    return "Customer-created Notification media artifact kind must be CUSTOMER_ID_CARD.";
  }

  if (
    artifact.storageMode !== "LOCAL" &&
    artifact.storageMode !== "USB"
  ) {
    return "Customer-created Notification media artifact storage mode is invalid.";
  }

  if (
    artifact.mimeType !==
    "image/png"
  ) {
    return "Customer-created Notification media artifact must use image/png.";
  }

  const fileName =
    normalizeString(
      artifact.fileName,
    );

  if (
    !fileName ||
    !fileName
      .toLowerCase()
      .endsWith(".png") ||
    fileName.includes("/") ||
    fileName.includes("\\")
  ) {
    return "Customer-created Notification media artifact file name is invalid.";
  }

  if (
    !Number.isSafeInteger(
      artifact.byteLength,
    ) ||
    artifact.byteLength <= 0
  ) {
    return "Customer-created Notification media artifact byte length is invalid.";
  }

  if (
    !/^[a-f0-9]{64}$/.test(
      normalizeString(
        artifact.sha256,
      ),
    )
  ) {
    return "Customer-created Notification media artifact SHA-256 is invalid.";
  }

  if (
    !normalizeString(
      artifact.createdAt,
    ) ||
    !Number.isFinite(
      Date.parse(
        artifact.createdAt,
      ),
    )
  ) {
    return "Customer-created Notification media artifact createdAt is invalid.";
  }

  if (
    artifact.schemaVersion !==
    1
  ) {
    return "Customer-created Notification media artifact schema version is invalid.";
  }

  if (
    normalizeString(
      artifact.scope?.ownerId,
    ) !==
    scope.ownerId
  ) {
    return "Customer-created Notification media artifact Owner scope does not match.";
  }

  if (
    normalizeString(
      artifact.scope?.businessId,
    ) !==
    scope.businessId
  ) {
    return "Customer-created Notification media artifact Business scope does not match.";
  }

  if (
    normalizeString(
      artifact.scope?.branchId,
    ) !==
    scope.branchId
  ) {
    return "Customer-created Notification media artifact Branch scope does not match.";
  }

  return undefined;
}

/* ============================================================
   NOTIFICATION IDENTITY CONSISTENCY
============================================================ */

function notificationMatchesExpectedIdentity(
  existing:
    NotificationRecord,

  expected:
    CustomerNotificationRecord,
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
      "CUSTOMER" &&
    existing.eventType ===
      "CUSTOMER_CREATED" &&
    normalizeString(existing.source.customerId) ===
      normalizeString(expected.source.customerId)
  );
}

/* ============================================================
   DELIVERY IDENTITY CONSISTENCY
============================================================ */

function deliveryMatchesExpectedIdentity(
  existing:
    NotificationDeliveryRecord,

  expected:
    NotificationDeliveryRecord,
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
    CustomerCreatedNotificationGeneratorScope,

  notification:
    CustomerNotificationRecord,

  options?:
    RepositoryWriteOptions,
): Promise<
  EnsureRecordResult<CustomerNotificationRecord>
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
        "Unable to verify existing Customer-created Notification.",
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
          `Customer-created Notification identity collision for ${notification.id}.`,
      };
    }

    if (
      existingResult.data.audience !==
      "CUSTOMER"
    ) {
      return {
        success: false,

        error:
          `Customer-created Notification audience collision for ${notification.id}.`,
      };
    }

    return {
      success: true,

      state:
        "EXISTING",

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
    if (
      saveResult.data.audience !==
      "CUSTOMER"
    ) {
      return {
        success: false,

        error:
          `Saved Customer-created Notification audience is invalid for ${notification.id}.`,
      };
    }

    return {
      success: true,

      state:
        "CREATED",

      record:
        saveResult.data,
    };
  }

  /*
   * A repeated or concurrent generation may have completed
   * between FIND and SAVE. Re-read once and accept only an
   * identity-compatible CUSTOMER record.
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
    recoveredNotification.audience ===
      "CUSTOMER" &&
    notificationMatchesExpectedIdentity(
      recoveredNotification,

      notification,
    )
  ) {
    return {
      success: true,

      state:
        "EXISTING",

      record:
        recoveredNotification,
    };
  }

  return {
    success: false,

    error:
      saveResult.error ??
      recoveryResult.error ??
      "Unable to save Customer-created Notification.",
  };
}

/* ============================================================
   ENSURE DELIVERY
============================================================ */

async function ensureDelivery(
  scope:
    CustomerCreatedNotificationGeneratorScope,

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
        "Unable to verify existing Customer-created Notification delivery.",
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

      state:
        "EXISTING",

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

      state:
        "CREATED",

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

      state:
        "EXISTING",

      record:
        recoveredDelivery,
    };
  }

  return {
    success: false,

    error:
      saveResult.error ??
      recoveryResult.error ??
      "Unable to save Customer-created Notification delivery.",
  };
}

/* ============================================================
   REPORT RESULT
============================================================ */

function finalizeReport(
  report:
    CustomerCreatedNotificationGenerationReport,
): CustomerCreatedNotificationGenerationResult {
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

export class CustomerCreatedNotificationGenerator {
  async generate(
    input:
      CustomerCreatedNotificationGeneratorInput,

    options?:
      RepositoryWriteOptions,
  ): Promise<
    CustomerCreatedNotificationGenerationResult
  > {
    const scope =
      normalizeScope(
        input.businessIdentity,
      );

    if (!scope.ownerId) {
      return {
        success: false,

        error:
          "Owner ID is required for Customer-created Notification generation.",
      };
    }

    if (!scope.businessId) {
      return {
        success: false,

        error:
          "Business ID is required for Customer-created Notification generation.",
      };
    }

    if (!scope.branchId) {
      return {
        success: false,

        error:
          "Branch ID is required for Customer-created Notification generation.",
      };
    }

    if (!isValidTimestamp(input.generatedAt)) {
      return {
        success: false,

        error:
          "Generation timestamp is invalid for Customer-created Notification generation.",
      };
    }

    const customerId =
      normalizeString(
        input.customer.identity.customerId,
      );

    const customerBusinessId =
      normalizeString(
        input.customer.identity.businessId,
      );

    const customerBranchId =
      normalizeString(
        input.customer.identity.branchId,
      );

    const customerCreatedAt =
      normalizeString(
        input.customer.identity.createdAt,
      );

    const businessName =
      normalizeString(
        input.businessIdentity.businessName,
      );

    const branchName =
      normalizeString(
        input.businessIdentity.branchName,
      );

    if (!customerId) {
      return {
        success: false,

        error:
          "Persisted Customer ID is required for Customer-created Notification generation.",
      };
    }

    if (
      customerBusinessId !==
      scope.businessId
    ) {
      return {
        success: false,

        error:
          "Persisted Customer Business ID does not match the active Business Identity.",
      };
    }

    if (
      customerBranchId !==
      scope.branchId
    ) {
      return {
        success: false,

        error:
          "Persisted Customer Branch ID does not match the active Business Identity.",
      };
    }

    if (!isValidTimestamp(customerCreatedAt)) {
      return {
        success: false,

        error:
          "Persisted Customer creation timestamp is invalid.",
      };
    }

    if (!businessName) {
      return {
        success: false,

        error:
          "Business name is required for Customer-created Notification generation.",
      };
    }

    if (!branchName) {
      return {
        success: false,

        error:
          "Branch name is required for Customer-created Notification generation.",
      };
    }

    /* ========================================================
       DETERMINISTIC NOTIFICATION IDENTITY
    ======================================================== */

    const identity =
      buildCustomerCreatedNotificationId({
        ...scope,

        customerId,
      });

    if (!identity.success) {
      return {
        success: false,

        error:
          identity.error,
      };
    }

    const report:
      CustomerCreatedNotificationGenerationReport = {
        notificationId:
          identity.id,

        notificationState:
          "NOT_CREATED",

        recipientResolved:
          false,

        deliveries: [],

        errors: [],
      };

    /* ========================================================
       PERSISTED BUSINESS TIME ZONE
    ======================================================== */

    const businessSettingsResult =
      await businessSettingsService.load(
        scope.businessId,
      );

    if (!businessSettingsResult.success) {
      report.errors.push(
        businessSettingsResult.error ??
        "Unable to load Business Settings for Customer-created Notification generation.",
      );

      return finalizeReport(
        report,
      );
    }

    if (!businessSettingsResult.data) {
      report.errors.push(
        "Business Settings are unavailable for Customer-created Notification generation.",
      );

      return finalizeReport(
        report,
      );
    }

    const businessTimeZone =
      normalizeString(
        businessSettingsResult.data.timeZone,
      );

    if (!businessTimeZone) {
      report.errors.push(
        "Business time zone is unavailable for Customer-created Notification generation.",
      );

      return finalizeReport(
        report,
      );
    }

    const createdCalendarDate =
      getBusinessCalendarDate(
        customerCreatedAt,

        businessTimeZone,
      );

    if (!createdCalendarDate) {
      report.errors.push(
        "Unable to resolve the persisted Customer creation timestamp to the Business-local calendar date.",
      );

      return finalizeReport(
        report,
      );
    }

    report.businessTimeZone =
      businessTimeZone;

    report.createdCalendarDate =
      createdCalendarDate;

    /* ========================================================
       AUTHORITATIVE CUSTOMER RECIPIENT
    ======================================================== */

    const recipientResolution =
      await customerNotificationRecipientResolver.resolve(
        customerId,
      );

    if (!recipientResolution.success) {
      report.errors.push(
        recipientResolution.error,
      );

      return finalizeReport(
        report,
      );
    }

    report.recipientResolved =
      true;

    const resolvedRecipientCustomerId =
      normalizeString(
        recipientResolution.recipient.customerId,
      );

    if (
      resolvedRecipientCustomerId !==
      customerId
    ) {
      report.errors.push(
        "Resolved Notification recipient Customer ID does not match the persisted Customer.",
      );

      return finalizeReport(
        report,
      );
    }

    const customerName =
      normalizeString(
        recipientResolution.recipient.customerName,
      ) ||
      normalizeString(
        input.customer.basic.fullName,
      );

    /* ========================================================
       CUSTOMER CONTENT
    ======================================================== */

    const contentResult =
      buildCustomerCreatedNotificationContent({
        customerId,

        customerName,

        businessName,

        branchName,

        createdCalendarDate,

        preferredLanguage:
          recipientResolution.preferredLanguage,
      });

    if (!contentResult.success) {
      report.errors.push(
        contentResult.error,
      );

      return finalizeReport(
        report,
      );
    }

    const content =
      contentResult.content;

    if (input.mediaArtifact) {
      const mediaArtifactError =
        validateCustomerCreatedMediaArtifact(
          input.mediaArtifact,
          scope,
        );

      if (mediaArtifactError) {
        report.errors.push(
          mediaArtifactError,
        );

        return finalizeReport(
          report,
        );
      }
    }

    /* ========================================================
       LOGICAL CUSTOMER NOTIFICATION
    ======================================================== */

    const notification:
      CustomerNotificationRecord = {
        id:
          identity.id,

        notificationId:
          identity.id,

        entity:
          NOTIFICATION_ENTITY,

        ...scope,

        audience:
          "CUSTOMER",

        eventType:
          "CUSTOMER_CREATED",

        priority:
          "NORMAL",

        title:
          content.title,

        message:
          content.message,

        source: {
          customerId,
        },

        templateContext: {
          templateKey:
            "CUSTOMER::CUSTOMER_CREATED::ENGLISH",

          requestedLanguage:
            content.requestedLanguage,

          resolvedLanguage:
            content.resolvedLanguage,

          variables: {
            customerName,

            businessName,

            customerId,

            branchName,

            createdDate:
              content.createdDateDisplay,

            createdCalendarDate,
          },

          schemaVersion:
            1,
        },

        ...(input.mediaArtifact
          ? {
              mediaArtifact:
                input.mediaArtifact,
            }
          : {}),

        scheduledFor:
          input.generatedAt,

        createdAt:
          input.generatedAt,

        updatedAt:
          input.generatedAt,
      };

    const notificationEnsure =
      await ensureNotification(
        scope,

        notification,

        options,
      );

    if (!notificationEnsure.success) {
      report.errors.push(
        notificationEnsure.error,
      );

      return finalizeReport(
        report,
      );
    }

    report.notificationState =
      notificationEnsure.state;

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
            identity.id,

          channel,
        });

      if (!deliveryIdentity.success) {
        report.deliveries.push({
          channel,

          deliveryId: "",

          state:
            "NOT_CREATED",

          error:
            deliveryIdentity.error,
        });

        report.errors.push(
          deliveryIdentity.error,
        );

        continue;
      }

      /* ------------------------------------------------------
         EFFECTIVE POLICY

         Storage / repository failure is not a policy block.
         The deterministic Delivery remains absent for recovery.
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
              "CUSTOMER_CREATED",
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
            identity.id,

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

      if (
        deliveryEnsure.state ===
        "CREATED"
      ) {
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

export const customerCreatedNotificationGenerator =
  new CustomerCreatedNotificationGenerator();

/* ============================================================
   END
============================================================ */