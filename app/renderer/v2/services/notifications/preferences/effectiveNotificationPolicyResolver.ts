// ============================================================
// FINORA ENTERPRISE OS™
//
// NOTIFICATIONS ENGINE™
// EFFECTIVE NOTIFICATION POLICY RESOLVER
//
// RESPONSIBILITY:
//
// - Resolve Business-wide Notification policy.
// - Resolve Customer-specific Notification overrides.
// - Enforce Business policy as the upper authority.
// - Treat missing Customer preference as INHERIT.
// - Fail closed when Business policy is missing.
// - Return explicit allow / block reasons.
//
// IMPORTANT:
//
// - No UI.
// - No provider calls.
// - No scheduler logic.
// - No retry logic.
// - No Customer profile loading.
// - No recipient/contact validation.
// - No Notification persistence.
// - No Delivery persistence.
// - Customer ENABLED can never bypass a Business-level block.
//
// VERSION : 1.0
// STATUS  : Production Foundation
// ============================================================

/* ============================================================
   IMPORTS
============================================================ */

import type {
  CustomerNotificationChannel,
  NotificationEventType,
} from "../../../types/notifications/notification.types";

import type {
  CustomerNotificationPreferenceOverride,
} from "../../../types/notifications/notificationPreferences.types";

import {
  businessNotificationPolicyRepository,
} from "../../../repositories/notifications/businessNotificationPolicyRepository";

import {
  customerNotificationPreferenceRepository,
} from "../../../repositories/notifications/customerNotificationPreferenceRepository";

import type {
  StorageResult,
} from "../../../storage/storage.types";

/* ============================================================
   SCOPE
============================================================ */

export interface EffectiveNotificationPolicyScope {
  ownerId: string;

  businessId: string;

  branchId: string;

  customerId: string;
}

/* ============================================================
   REQUEST
============================================================ */

export interface EffectiveNotificationPolicyRequest {
  channel: CustomerNotificationChannel;

  eventType: NotificationEventType;
}

/* ============================================================
   BLOCK REASON
============================================================ */

export type EffectiveNotificationPolicyBlockReason =
  | "MISSING_BUSINESS_POLICY"
  | "BUSINESS_DISABLED"
  | "BUSINESS_CHANNEL_DISABLED"
  | "BUSINESS_EVENT_DISABLED"
  | "CUSTOMER_CHANNEL_DISABLED"
  | "CUSTOMER_EVENT_DISABLED";

/* ============================================================
   RESULT
============================================================ */

export type EffectiveCustomerPreferenceState =
  | "NOT_EVALUATED"
  | "MISSING"
  | "FOUND";

export interface EffectiveNotificationPolicyDecision {
  allowed: boolean;

  blockReason?:
    EffectiveNotificationPolicyBlockReason;

  channel:
    CustomerNotificationChannel;

  eventType:
    NotificationEventType;

  customerPreferenceState:
    EffectiveCustomerPreferenceState;

  customerChannelOverride:
    CustomerNotificationPreferenceOverride;

  customerEventOverride:
    CustomerNotificationPreferenceOverride;
}

/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeString(
  value: string,
): string {
  return String(value ?? "").trim();
}

function normalizeScope(
  scope: EffectiveNotificationPolicyScope,
): EffectiveNotificationPolicyScope {
  return {
    ownerId:
      normalizeString(scope.ownerId),

    businessId:
      normalizeString(scope.businessId),

    branchId:
      normalizeString(scope.branchId),

    customerId:
      normalizeString(scope.customerId),
  };
}

/* ============================================================
   SCOPE VALIDATION
============================================================ */

function validateScope(
  scope: EffectiveNotificationPolicyScope,
): string | undefined {
  if (!scope.ownerId) {
    return "Owner ID is required to resolve Notification policy.";
  }

  if (!scope.businessId) {
    return "Business ID is required to resolve Notification policy.";
  }

  if (!scope.branchId) {
    return "Branch ID is required to resolve Notification policy.";
  }

  if (!scope.customerId) {
    return "Customer ID is required to resolve Notification policy.";
  }

  return undefined;
}

/* ============================================================
   DECISION BUILDER
============================================================ */

function buildDecision(
  request: EffectiveNotificationPolicyRequest,

  customerPreferenceState:
    EffectiveCustomerPreferenceState,

  customerChannelOverride:
    CustomerNotificationPreferenceOverride,

  customerEventOverride:
    CustomerNotificationPreferenceOverride,

  blockReason?:
    EffectiveNotificationPolicyBlockReason,
): EffectiveNotificationPolicyDecision {
  return {
    allowed:
      blockReason === undefined,

    blockReason,

    channel:
      request.channel,

    eventType:
      request.eventType,

    customerPreferenceState,

    customerChannelOverride,

    customerEventOverride,
  };
}

/* ============================================================
   RESOLVER
============================================================ */

export class EffectiveNotificationPolicyResolver {
  async resolve(
    scope: EffectiveNotificationPolicyScope,

    request: EffectiveNotificationPolicyRequest,
  ): Promise<
    StorageResult<EffectiveNotificationPolicyDecision>
  > {
    const normalizedScope =
      normalizeScope(scope);

    const scopeError =
      validateScope(normalizedScope);

    if (scopeError) {
      return {
        success: false,

        error: scopeError,
      };
    }

    /* ========================================================
       BUSINESS POLICY
    ======================================================== */

    const businessPolicyResult =
      await businessNotificationPolicyRepository.find({
        ownerId:
          normalizedScope.ownerId,

        businessId:
          normalizedScope.businessId,
      });

    if (!businessPolicyResult.success) {
      return {
        success: false,

        error:
          businessPolicyResult.error ??
          "Unable to resolve Business Notification policy.",
      };
    }

    const businessPolicy =
      businessPolicyResult.data;

    /* ========================================================
       MISSING BUSINESS POLICY
    ======================================================== */

    if (!businessPolicy) {
      return {
        success: true,

        data:
          buildDecision(
            request,

            "NOT_EVALUATED",

            "INHERIT",

            "INHERIT",

            "MISSING_BUSINESS_POLICY",
          ),
      };
    }

    /* ========================================================
       BUSINESS MASTER SWITCH
    ======================================================== */

    if (!businessPolicy.enabled) {
      return {
        success: true,

        data:
          buildDecision(
            request,

            "NOT_EVALUATED",

            "INHERIT",

            "INHERIT",

            "BUSINESS_DISABLED",
          ),
      };
    }

    /* ========================================================
       BUSINESS CHANNEL
    ======================================================== */

    if (!businessPolicy.channels[request.channel]) {
      return {
        success: true,

        data:
          buildDecision(
            request,

            "NOT_EVALUATED",

            "INHERIT",

            "INHERIT",

            "BUSINESS_CHANNEL_DISABLED",
          ),
      };
    }

    /* ========================================================
       BUSINESS EVENT
    ======================================================== */

    if (!businessPolicy.events[request.eventType]) {
      return {
        success: true,

        data:
          buildDecision(
            request,

            "NOT_EVALUATED",

            "INHERIT",

            "INHERIT",

            "BUSINESS_EVENT_DISABLED",
          ),
      };
    }

    /* ========================================================
       CUSTOMER PREFERENCE
    ======================================================== */

    const customerPreferenceResult =
      await customerNotificationPreferenceRepository.find({
        ownerId:
          normalizedScope.ownerId,

        businessId:
          normalizedScope.businessId,

        branchId:
          normalizedScope.branchId,

        customerId:
          normalizedScope.customerId,
      });

    if (!customerPreferenceResult.success) {
      return {
        success: false,

        error:
          customerPreferenceResult.error ??
          "Unable to resolve Customer Notification preference.",
      };
    }

    const customerPreference =
      customerPreferenceResult.data;

    /* ========================================================
       CUSTOMER MISSING = INHERIT
    ======================================================== */

    if (!customerPreference) {
      return {
        success: true,

        data:
          buildDecision(
            request,

            "MISSING",

            "INHERIT",

            "INHERIT",
          ),
      };
    }

    const customerChannelOverride =
      customerPreference.channelOverrides[
        request.channel
      ];

    const customerEventOverride =
      customerPreference.eventOverrides[
        request.eventType
      ];

    /* ========================================================
       CUSTOMER CHANNEL BLOCK
    ======================================================== */

    if (
      customerChannelOverride ===
      "DISABLED"
    ) {
      return {
        success: true,

        data:
          buildDecision(
            request,

            "FOUND",

            customerChannelOverride,

            customerEventOverride,

            "CUSTOMER_CHANNEL_DISABLED",
          ),
      };
    }

    /* ========================================================
       CUSTOMER EVENT BLOCK
    ======================================================== */

    if (
      customerEventOverride ===
      "DISABLED"
    ) {
      return {
        success: true,

        data:
          buildDecision(
            request,

            "FOUND",

            customerChannelOverride,

            customerEventOverride,

            "CUSTOMER_EVENT_DISABLED",
          ),
      };
    }

    /* ========================================================
       ALLOWED

       At this point:

       - Business master is enabled.
       - Business channel is enabled.
       - Business event is enabled.
       - Customer channel is INHERIT or ENABLED.
       - Customer event is INHERIT or ENABLED.

       Recipient/contact eligibility is intentionally resolved
       later by the Customer Notification Recipient Resolver.
    ======================================================== */

    return {
      success: true,

      data:
        buildDecision(
          request,

          "FOUND",

          customerChannelOverride,

          customerEventOverride,
        ),
    };
  }
}

/* ============================================================
   SINGLETON
============================================================ */

export const effectiveNotificationPolicyResolver =
  new EffectiveNotificationPolicyResolver();

/* ============================================================
   END
============================================================ */
